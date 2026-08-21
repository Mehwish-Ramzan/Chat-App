import { useEffect } from "react";
import { toast } from "sonner";
import { useAppStore } from "../../store";
import { useNavigate } from "react-router-dom";
import ContactContainer from "./contactContainer/ContactContainer";
import ChatContainer from "./chatContainer/ChatContainer";
import EmptyChatContainer from "./emptyChatContainer/EmptyChatContainer";

const Chat = () => {
  const {
    userInfo,
    selectedChatType,
  } = useAppStore();

  const navigate = useNavigate();

  useEffect(() => {
    if (userInfo && !userInfo.profileSetup) {
      toast.error(
        "Please complete your profile before accessing chat.",
      );
      navigate("/profile");
    }
  }, [userInfo, navigate]);

  return (
    <div className="flex h-[100vh] overflow-hidden text-white">
      <ContactContainer />

      {selectedChatType === undefined ? (
        <EmptyChatContainer />
      ) : (
        <ChatContainer />
      )}
    </div>
  );
};

export default Chat;