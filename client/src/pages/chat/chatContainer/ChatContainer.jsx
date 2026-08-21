import ChatHeader from "./components/chatHeader/ChatHeader"
import MessageContainer from "./components/messageContainer/MessageContainer"
import MessageBar from "./components/messageBar/MessageBar"

const ChatContainer = () => {
  return (
    <div className="fixed top-0 h-[100vh] w-[100vw] bg-[#1c1d25] flex flex-col md:static md:flex-1">
     <ChatHeader />
     <MessageContainer />
     <MessageBar /> 
    </div>
  )
}

export default ChatContainer
 