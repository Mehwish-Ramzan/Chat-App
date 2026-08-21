import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { HOST } from "@/utils/constants.js";
import { useAppStore } from "@/store";
import { getColor } from "@/lib/utils.js";
import { FaEdit } from "react-icons/fa";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import { IoPowerSharp } from "react-icons/io5";
import apiClient from "@/lib/api-client.js";
import { LOGOUT_ROUTE } from "@/utils/constants.js";

const ProfileInfo = () => {
  const { userInfo, setUserInfo, resetChatState } = useAppStore();
  const navigate = useNavigate();

  const buildImageUrl = (img) => {
  if (!img) return null;
  if (img.startsWith("http")) return img;
  return `${HOST}/${img.replace(/^\/+/, "")}`;
};

const profileImage = buildImageUrl(userInfo?.image);

  const logOut = async () => {
    try {
      const response = await apiClient.post(
        LOGOUT_ROUTE,
        {},
        { withCredentials: true }
      );
      if (response.status === 200) {
        setUserInfo(null);
        navigate("/auth");
      } else {
        console.error("Logout failed:", response.data?.message);
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };



  return (
    <div className="absolute bottom-0 flex items-center h-16 justify-between px-1 left-0 right-0 w-full bg-[#2a2b33]">
      <div className="flex gap-1 items-center justify-center">
        <div className="pr-1 w-12 h-12 relative">
          <Avatar className=" h-12 w-12 rounded-full overflow-hidden">
            {profileImage ? (
              <AvatarImage
                src={profileImage}
                alt="profile"
                className="object-cover h-full w-full bg-black"
              />
            ) : (
              <div
                className={`uppercase flex items-center justify-center h-12 w-12 rounded-full ${getColor(
                  userInfo?.color ?? 0
                )}`}
                style={{ lineHeight: 1 }}
              >
                {userInfo?.firstName
                  ? userInfo.firstName.charAt(0)
                  : userInfo?.email
                  ? userInfo.email.charAt(0).toUpperCase()
                  : "U"}
              </div>
            )}
          </Avatar>
        </div>
        <div className="text-white text-sm md:text-base font-medium whitespace-nowrap ml-1">
          {userInfo?.firstName && userInfo?.lastName ? (
            <span>
              {userInfo.firstName} {userInfo.lastName}
            </span>
          ) : (
            <span>{userInfo?.email}</span>
          )}
        </div>
      </div>
      <div className="flex gap-2 ml-3">
        <Tooltip>
          <TooltipTrigger>
            <FaEdit
              className="text-purple-500 text-xl font-medium cursor-pointer"
              onClick={() => navigate("/profile")}
            />
          </TooltipTrigger>
          <TooltipContent className="bg-[#1c1b1e] border-none text-white">
            <p>Edit Profile</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger>
            <IoPowerSharp
              className="text-red-500 text-xl font-medium cursor-pointer"
              onClick={logOut}
            />
          </TooltipTrigger>
          <TooltipContent className="bg-[#1c1b1e] border-none text-white">
            <p>Log Out</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};

export default ProfileInfo;
