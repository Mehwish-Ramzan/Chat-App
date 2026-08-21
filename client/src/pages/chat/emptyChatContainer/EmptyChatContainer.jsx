import Lottie from "react-lottie";
import { animationDefaultOptions } from "../../../lib/utils";

const EmptyChatContainer = () => {
  return (
    <div className="flex-1 md:bg-[#1c1b25] md:flex flex-col hidden items-center justify-center transition-all duration-1000">
      <Lottie
        isClickToPauseDisabled={true}
        height={200}
        width={200}
        options={animationDefaultOptions.loading}
      />
      <div className="text-center text-opacity-80 text-white flex flex-col gap-5 item-center mt-10 lg:text-4xl transition-all duration-300">
        <h3 className="poppins-medium">
          Hi
          <span className="text-purple-500">! </span> Welcome to
          <span className="text-purple-500"> Syncronus</span> Chat App
          <span className="text-purple-500">.</span>
          <p className="text-sm text-gray-400">
            Start a conversation with someone!
          </p>
        </h3>
      </div>
    </div>
  );
};

export default EmptyChatContainer;
