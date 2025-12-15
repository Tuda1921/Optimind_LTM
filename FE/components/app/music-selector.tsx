// Tên file: app/components/MusicPlayer.tsx
"use client";

import React, {
	FC,
	useState,
	useRef,
	useEffect,
	useCallback,
	ChangeEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	X,
	Play,
	Pause,
	Volume2,
	VolumeX,
	ChevronRight,
	Music,
	Plus,
	SkipForward,
	MoreVertical,
	Trash2,
	Pencil,
	RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMusicContext, Track } from "@/hooks/useMusic";

// Hàm tiện ích
const glassEffect =
	"bg-black/40 backdrop-blur-md border border-white/20 rounded-xl shadow-lg";

// Hàm định dạng thời gian (giây -> mm:ss)
const formatSeconds = (seconds: number): string => {
	if (isNaN(seconds) || seconds < 0) return "00:00";
	const totalSeconds = Math.floor(seconds);
	const minutes = Math.floor(totalSeconds / 60);
	const remainingSeconds = totalSeconds % 60;
	return `${String(minutes).padStart(2, "0")}:${String(
		remainingSeconds
	).padStart(2, "0")}`;
};

interface MusicPlayerProps {}

const MusicPlayer: FC<MusicPlayerProps> = () => {
	// Lấy state và handlers từ Context
	const {
		tracks,
		currentTrack,
		isPlaying,
		isPlayerVisible,
		setIsPlaying, // THAY ĐỔI
		setCurrentTrack,
		handleSkipForward,
		handleReplay, // MỚI
		togglePlayerVisibility,
		addCustomTrack,
		deleteTrack,
		updateTrackName, // MỚI
		getYouTubeEmbedUrl,
	} = useMusicContext();

	// States cục bộ
	const [customUrlInput, setCustomUrlInput] = useState("");
	const [customTrackName, setCustomTrackName] = useState("");
	const [isRenameOpen, setIsRenameOpen] = useState(false);
	const [renameTrackId, setRenameTrackId] = useState<string | null>(null);
	const [newTrackName, setNewTrackName] = useState("");
	const [volume, setVolume] = useState(50);
	const iframeRef = useRef<HTMLIFrameElement>(null);

	// --- HANDLERS ---

	const handleAddCustomUrl = () => {
		const url = customUrlInput.trim();
		let name = customTrackName.trim();

		if (!url || !url.startsWith("http")) {
			alert("Vui lòng nhập URL hợp lệ (bắt đầu bằng http/https).");
			return;
		}

		const youtubeId = url.match(
			/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([^&?/\s]{11})/
		)?.[1];

		if (!name) {
			name = youtubeId ? "Video YouTube" : url.substring(0, 30) + "...";
		}

		const newTrack: Track = {
			id: `custom-${crypto.randomUUID()}`,
			name: name,
			type: youtubeId ? "YouTube" : "Custom",
			artist: youtubeId ? "YouTube" : "Custom URL",
			url: url,
		};

		addCustomTrack(newTrack);
		setCustomUrlInput("");
		setCustomTrackName("");
	};

	// Xử lý chọn track
	const handleTrackSelect = (track: any) => {
		setCurrentTrack(track);
	};

	// Xử lý Xóa track
	const handleDeleteTrack = (trackId: string) => {
		deleteTrack(trackId);
	};

	// Xử lý Đổi tên (Mở Dialog)
	const handleStartRename = (track: any) => {
		setRenameTrackId(track.id);
		setNewTrackName(track.name);
		setIsRenameOpen(true);
	};

	// Xử lý Lưu tên trong Dialog
	const handleSaveRename = () => {
		if (!renameTrackId || !newTrackName.trim()) {
			setIsRenameOpen(false);
			return;
		}
		setIsRenameOpen(false);
		updateTrackName(renameTrackId, newTrackName.trim());
	};

	// --- HÀM TƯƠNG TÁC IFRAME (Gửi lệnh đến YouTube API) ---
	const postMessageToIframe = (action: string, value?: number) => {
		if (!iframeRef.current) return;

		// Cần đảm bảo iframe đã sẵn sàng
		const iframe = iframeRef.current.contentWindow;

		// Lệnh được gửi phải theo format API của YT
		iframe?.postMessage(
			JSON.stringify({
				event: "command",
				func: action,
				args: value !== undefined ? [value] : [],
			}),
			"*" // Bỏ qua domain origin vì chúng ta gửi từ chính trang
		);
		console.log("Update volume: ", action, value);
	};

	// --- EFFECT CHÍNH (Đồng bộ State -> DOM) ---
	useEffect(() => {
		if (iframeRef.current) {
			// Cập nhật âm lượng khi volume state thay đổi
			postMessageToIframe("setVolume", volume);
		}

		// Khi isPlaying thay đổi, gửi lệnh Play/Pause
		if (isPlaying) {
			// Gửi lệnh PLAY khi trạng thái là playing
			postMessageToIframe("playVideo");
		} else {
			// Gửi lệnh PAUSE khi trạng thái là paused
			postMessageToIframe("pauseVideo");
		}
	}, [isPlaying, volume, currentTrack.url]); // Thêm currentTrack.url để chạy lại khi source đổi

	return (
		<div
			className={cn(
				"fixed top-1/2 right-[100px] -translate-y-1/2 z-30 w-80 h-[450px] p-4 flex flex-col", // Giảm chiều cao về 450px
				glassEffect,
				"transition-opacity duration-300",
				isPlayerVisible
					? "opacity-100 visible"
					: "opacity-0 invisible pointer-events-none" // CSS ẩn/hiện
			)}
		>
			{/* Header và nút đóng */}
			<div className="flex justify-between items-center pb-3 border-b border-white/20">
				<h3 className="text-lg font-semibold">Nhạc nền & Âm thanh</h3>
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8 text-white hover:bg-white/20"
					onClick={() => togglePlayerVisibility(false)}
				>
					<X className="h-4 w-4" />
				</Button>
			</div>

			{/* YouTube iframe - chỉ render khi có URL */}
			{getYouTubeEmbedUrl() && (
				<iframe
					ref={iframeRef}
					src={getYouTubeEmbedUrl()}
					allow="autoplay; encrypted-media; pointer-lock"
					title="YouTube Player"
					sandbox="allow-scripts allow-same-origin"
				/>
			)}

			{/* Điều khiển Phát/Tạm dừng/Replay */}
			<div className="flex items-center gap-3 py-3 border-b border-white/20">
				<Button
					size="icon"
					className="h-10 w-10 rounded-full bg-white text-black hover:bg-gray-200"
					onClick={() => setIsPlaying(!isPlaying)}
				>
					{isPlaying ? (
						<Pause className="w-5 h-5" />
					) : (
						<Play className="w-5 h-5" />
					)}
				</Button>

				{/* MỚI: Nút Replay */}
				<Button
					size="icon"
					className="h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20"
					onClick={handleReplay}
				>
					<RotateCcw className="w-5 h-5" />
				</Button>

				{/* KHÔI PHỤC: Nút Skip Forward */}
				<Button
					size="icon"
					className="h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20"
					onClick={handleSkipForward} // Sử dụng hàm chuyển bài từ Context
				>
					<SkipForward className="w-5 h-5" />
				</Button>

				<div className="flex-1">
					<p className="font-semibold truncate">
						{currentTrack.name}
					</p>
					<p className="text-xs text-gray-400 truncate">
						{currentTrack.artist}
					</p>
				</div>
			</div>

			{/* Điều khiển Âm lượng */}
			<div className="flex items-center gap-3 py-3 border-b border-white/20">
				{volume === 0 ? (
					<VolumeX className="w-5 h-5 text-red-400" />
				) : (
					<Volume2 className="w-5 h-5" />
				)}
				<input
					type="range"
					min="0"
					max="100"
					value={volume}
					onChange={(e) => setVolume(Number(e.target.value))}
					className="flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-gray-500/50"
					style={{
						background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume}%, #4b5563 ${volume}%, #4b5563 100%)`,
					}}
				/>
			</div>

			{/* --- Phần Dán URL --- */}
			<div className="space-y-2 pt-3 border-b border-white/20 pb-4">
				<div className="flex gap-2">
					<Input
						placeholder="Dán liên kết (Audio MP3 hoặc YouTube)"
						value={customUrlInput}
						onChange={(e) => setCustomUrlInput(e.target.value)}
						className="bg-white/10 border-white/30 flex-1"
					/>
					<Button
						onClick={handleAddCustomUrl}
						disabled={!customUrlInput}
						size="icon"
					>
						<Plus className="w-4 h-4" />
					</Button>
				</div>
				<p className="text-xs text-gray-400">
					*Hỗ trợ các liên kết MP3 trực tiếp hoặc URL YouTube.
				</p>
			</div>

			{/* Danh sách nhạc (scrollable) */}
			<h4 className="text-sm font-semibold mt-2 mb-2">Chọn bản nhạc</h4>
			<ScrollArea className="flex-1 overflow-hidden">
				<div className="space-y-1 p-1">
					{tracks.map((track) => (
						<div
							key={track.id}
							className={cn(
								"flex justify-between items-center group rounded-md hover:bg-white/20",
								currentTrack.id === track.id && "bg-white/20",
								currentTrack.id === track.id &&
									isPlaying &&
									"ring-2 ring-green-400 text-green-400"
							)}
						>
							<div
								className={cn(
									"flex w-full items-center h-auto p-2 gap-3 text-left"
								)}
								onClick={() => handleTrackSelect(track)}
							>
								<Music className="w-4 h-4 shrink-0" />
								<div className="flex-1 truncate">
									<p className="text-sm truncate">
										{track.name}
									</p>
								</div>
							</div>

							{/* Nút 3 chấm (Edit/Delete) */}
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										className="h-8 w-8 text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-white/20"
									>
										<MoreVertical className="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent className="bg-black/70 backdrop-blur-md border-white/20 text-white">
									<DropdownMenuItem
										className="cursor-pointer"
										onClick={() => handleStartRename(track)}
									>
										<Pencil className="mr-2 h-4 w-4" />
										Đổi tên
									</DropdownMenuItem>
									<DropdownMenuItem
										className="cursor-pointer text-red-400 focus:text-red-400"
										onClick={() =>
											handleDeleteTrack(track.id)
										}
									>
										<Trash2 className="mr-2 h-4 w-4" />
										Xóa
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					))}
				</div>
			</ScrollArea>

			{/* Dialog Đổi tên */}
			<Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
				<DialogContent className="bg-black/70 backdrop-blur-md border-white/20 text-white">
					<DialogHeader>
						<DialogTitle>Đổi tên bài hát</DialogTitle>
					</DialogHeader>
					<div className="space-y-2">
						<Label htmlFor="new-name">Tên mới</Label>
						<Input
							id="new-name"
							value={newTrackName}
							onChange={(e) => setNewTrackName(e.target.value)}
							className="bg-white/10 border-white/30"
							placeholder="Nhập tên mới..."
							onKeyDown={(e) =>
								e.key === "Enter" && handleSaveRename()
							}
						/>
					</div>
					<DialogFooter>
						<Button
							variant="ghost"
							onClick={() => setIsRenameOpen(false)}
						>
							Hủy
						</Button>
						<Button
							onClick={handleSaveRename}
							disabled={!newTrackName.trim()}
						>
							Lưu
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default MusicPlayer;
