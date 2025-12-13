import { useCall, useCallStateHooks } from "@stream-io/video-react-sdk";
import { useState } from "react";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";

const EndCallButton = () => {
	const call = useCall();
	const router = useRouter();

	const { useLocalParticipant } = useCallStateHooks();
	const localParticipants = useLocalParticipant();

	const [isEndCallOpen, setIsEndCallOpen] = useState(false);

	const isMeetingOwner =
		localParticipants &&
		call?.state.createdBy &&
		localParticipants.userId === call.state.createdBy.id;

	if (!isMeetingOwner) return null;

	return (
		<>
			<Button
				variant={"destructive"}
				onClick={async () => {
					setIsEndCallOpen(true);
				}}
				className="cursor-pointer hover:bg-red-800"
			>
				End call
			</Button>
			<Dialog open={isEndCallOpen} onOpenChange={setIsEndCallOpen}>
				<DialogContent className={"bg-black/90 text-white"}>
					<DialogTitle className="font-bold text-2xl">
						End call for everyone
					</DialogTitle>
					Are you sure you want to end the call for all participants?
					<div className="flex gap-4 w-full justify-end">
						<Button
							variant={"destructive"}
							className="cursor-pointer hover:bg-red-800"
							onClick={async () => {
								await call.endCall();
								router.push("/rooms");
							}}
						>
							Yes, end call
						</Button>
						<Button
							variant={"outline"}
							className="cursor-pointer text-black hover:bg-gray-300"
							onClick={() => setIsEndCallOpen(false)}
						>
							Cancel
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
};

export default EndCallButton;
