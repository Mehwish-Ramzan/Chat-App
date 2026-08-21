import { useState, useRef, useEffect } from "react";
import { useAppStore } from "../../store";
import { useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";
import { Avatar, AvatarImage } from "../../components/ui/avatar";
import { FaTrash, FaPlus } from "react-icons/fa";
import { getColor } from "../../lib/utils.js";
import { colors } from "../../lib/utils.js";
import { toast } from "sonner";
import apiClient from "../../lib/api-client";
import {
  UPDATE_PROFILE_ROUTE,
  ADD_PROFILE_IMAGE_ROUTE,
  DELETE_PROFILE_IMAGE_ROUTE,
  HOST as CONFIG_HOST,
} from "../../utils/constants.js";

const Profile = () => {
  const navigate = useNavigate();
  const { userInfo, setUserInfo } = useAppStore();
  const fileInputRef = useRef(null);

  const [firstName, setFirstName] = useState(userInfo?.firstName || "");
  const [lastName, setLastName] = useState(userInfo?.lastName || "");
  const [image, setImage] = useState(null); // will hold preview/full URL
  const [selectedColor, setSelectedColor] = useState(userInfo?.color ?? 0);
  const [hovered, setHovered] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Ensure we have a working HOST (fallback to origin)
  const HOST = CONFIG_HOST || window.location.origin;

    const buildImageUrl = (img) => {
        if (!img) return null;
        if (img.startsWith("http")) return img;
        return `${HOST}/${img.replace(/^\/+/, "")}`;
      };

  useEffect(() => {
    setFirstName(userInfo?.firstName || "");
    setLastName(userInfo?.lastName || "");
    setSelectedColor(userInfo?.color ?? 0);

    // build preview url if server path present
    if (userInfo?.image) {
      setImage(buildImageUrl(userInfo.image));
    } else {
      setImage(null);
    }
  }, [userInfo, HOST]);

  // opens native file chooser; must be called from user action
  const handleFileInputClick = () => {
    fileInputRef.current?.click();
  };

  // user picked a file — preview then upload
  const handleImageUpload = async (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;

    // show instant local preview
    const previewUrl = URL.createObjectURL(file);
    setImage(previewUrl);

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("profile-image", file); // multer expects this field

      const resp = await apiClient.post(ADD_PROFILE_IMAGE_ROUTE, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });


      // Accept any 2xx code and look for image anywhere we expect it
      if (resp.status >= 200 && resp.status < 300) {
        const updatedUser = resp.data?.user;
        const serverImage = updatedUser?.image || resp.data?.image;

        if (!serverImage) {
          toast.error("Image uploaded, but server did not return image path");
          return;
        }

        setUserInfo({
          ...userInfo,
          ...(updatedUser || {}),
          image: serverImage,
          profileSetup: true,
        });

        setImage(buildImageUrl(serverImage));

        toast.success("Profile image uploaded successfully");
      } else {
        toast.error("Upload failed");
        // rollback preview to previous value
        setImage(
          userInfo?.image
            ? userInfo.image.startsWith("http")
              ? userInfo.image
              : `${HOST}/${userInfo.image.replace(/^\/+/, "")}`
            : null,
        );
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error(
        "Upload failed: " + (err.response?.data?.message || err.message),
      );
      // rollback preview
      setImage(
        userInfo?.image
          ? userInfo.image.startsWith("http")
            ? userInfo.image
            : `${HOST}/${userInfo.image.replace(/^\/+/, "")}`
          : null,
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = async () => {
    const prev = image;
    setImage(null); // optimistic

    try {
      const resp = await apiClient.delete(DELETE_PROFILE_IMAGE_ROUTE, {
        withCredentials: true,
      });
      if (resp.status >= 200 && resp.status < 300) {
        setUserInfo({ ...userInfo, image: null });
        toast.success("Profile image removed successfully");
      } else {
        throw new Error("Delete failed");
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error(
        "Failed to remove image: " +
          (err.response?.data?.message || err.message),
      );
      setImage(prev); // rollback
    }
  };

  const handleAvatarClick = () => {
    if (image) {
      handleRemoveImage();
    } else {
      handleFileInputClick();
    }
  };

  const validateProfile = () => {
    if (!firstName.trim()) {
      toast.error("First name is required");
      return false;
    }
    if (!lastName.trim()) {
      toast.error("Last name is required");
      return false;
    }
    return true;
  };

  const saveChanges = async () => {
    if (!validateProfile()) return;
    try {
      const response = await apiClient.post(
        UPDATE_PROFILE_ROUTE,
        { firstName, lastName, color: selectedColor },
        { withCredentials: true },
      );

      if (
        response.status >= 200 &&
        response.status < 300 &&
        response.data?.user
      ) {
        setUserInfo({
          ...userInfo,
          ...response.data.user,
          image: response.data.user.image ?? userInfo?.image ?? null,
          profileSetup: true,
        });
        toast.success("Profile updated successfully");
        navigate("/chat");
      } else {
        toast.error("Profile update failed");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error(
        "Failed to update profile: " +
          (err.response?.data?.message || err.message),
      );
    }
  };

  const handleNavigate = () => {
    if (userInfo?.profileSetup) navigate("/chat");
    else navigate("/auth");
  };

  return (
    <div className="bg-[#1b1c24] h-[100vh] flex items-center flex-col gap-10 justify-center">
      <div className="flex flex-col gap-10 w-[80vw] md:w-max">
        <div>
          <IoArrowBack
            className="text-white/90 cursor-pointer text-4xl lg:text-6xl"
            onClick={handleNavigate}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Avatar Section */}
          <div className="flex justify-center md:justify-start">
            <div
              className="relative w-32 h-32 md:w-48 md:h-48"
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
            >
              {/* Force a square container so initials remain circular */}
              <div onClick={handleAvatarClick} className="cursor-pointer">
                <div className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden">
                  {image ? (
                    <Avatar className="h-full w-full rounded-full overflow-hidden">
                      <AvatarImage
                        src={image}
                        alt="profile"
                        className="object-cover h-full w-full"
                      />
                    </Avatar>
                  ) : (
                    <div
                      className={`uppercase text-5xl md:text-7xl flex items-center justify-center h-full w-full rounded-full ${getColor(
                        selectedColor,
                      )}`}
                      style={{ lineHeight: 1 }} // keep text centered
                    >
                      {firstName
                        ? firstName.charAt(0)
                        : userInfo?.email
                          ? userInfo.email.charAt(0).toUpperCase()
                          : "U"}
                    </div>
                  )}
                </div>
              </div>

              {hovered && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                  {image ? (
                    <FaTrash
                      className="text-white text-3xl cursor-pointer"
                      onClick={handleRemoveImage}
                    />
                  ) : (
                    <FaPlus
                      className="text-white text-3xl cursor-pointer"
                      onClick={handleFileInputClick}
                    />
                  )}
                </div>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept=".jpeg,.png,.jpg,.svg,.webp"
              className="hidden"
            />
          </div>

          {/* Form Section */}
          <div className="flex flex-col gap-5 md:w-64 w-full">
            <div>
              <input
                type="email"
                placeholder="Email"
                value={userInfo?.email || ""}
                readOnly
                className="w-full rounded-lg bg-[#2c2e3b] p-4 border-none text-white"
              />
            </div>

            <div>
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-lg bg-[#2c2e3b] p-4 border-none text-white"
              />
            </div>

            <div>
              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-lg bg-[#2c2e3b] p-4 border-none text-white"
              />
            </div>

            <div className="flex gap-3">
              {colors.map((colorClass, index) => {
                const bgColor = colorClass.split(" ")[0];
                return (
                  <div
                    key={index}
                    className={`w-8 h-8 rounded-full cursor-pointer transition-all ${
                      selectedColor === index
                        ? "ring-2 ring-white scale-110"
                        : ""
                    } ${bgColor}`}
                    onClick={() => setSelectedColor(index)}
                  />
                );
              })}
            </div>

            <button
              onClick={saveChanges}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium mt-4"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
