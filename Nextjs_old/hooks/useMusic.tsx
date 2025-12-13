// Tên file: app/context/MusicContext.tsx
"use client";

import React, {
	createContext,
	useContext,
	useState,
	useMemo,
	useCallback,
	FC,
	ReactNode,
	useRef,
	useEffect,
} from "react";
import { useRouter } from "next/navigation";

// --- Types ---
export interface Track {
	id: string;
	name: string;
	type: "Soundscape" | "Music" | "Custom" | "YouTube";
	artist: string;
	url: string;
}

interface MusicContextType {
	tracks: Track[];
	currentTrack: Track;
	isPlaying: boolean;
	volume: number;
	isPlayerVisible: boolean;
	seekPosition: number;
	duration: number;

	// Handlers
	setVolume: (v: number) => void;
	setIsPlaying: (playing: boolean) => void;
	setCurrentTrack: (track: Track) => void;
	handleSkipForward: () => void;
	handleReplay: () => void; // MỚI: Thêm Replay
	togglePlayerVisibility: (visible: boolean) => void;
	addCustomTrack: (track: Track) => void;
	deleteTrack: (trackId: string) => void;
	updateTrackName: (trackId: string, newName: string) => void; // MỚI: Chỉnh sửa tên

	// Getter cho YouTube
	getYouTubeEmbedUrl: () => string;
}

// Dữ liệu nhạc giả (Giữ nguyên)
const mockTracks: Track[] = [
	{
		id: "rain",
		name: "Mưa Rào Nhẹ",
		type: "Soundscape",
		artist: "Optimind Sounds",
		url: "/sounds/rain.mp3",
	},
	{
		id: "lofi",
		name: "Lofi Focus Beat",
		type: "Music",
		artist: "Chill Beats",
		url: "/sounds/lofi.mp3",
	},
	{
		id: "piano",
		name: "Piano Thư Giãn",
		type: "Music",
		artist: "Classical",
		url: "/sounds/piano.mp3",
	},
];

// Khởi tạo Context
const MusicContext = createContext<MusicContextType | undefined>(undefined);

// --- Custom Hook ---
export const useMusicContext = () => {
	const context = useContext(MusicContext);
	if (context === undefined) {
		throw new Error("useMusicContext must be used within a MusicProvider");
	}
	return context;
};

// --- Utils ---
const getYouTubeId = (url: string): string | null => {
	const regex =
		/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([^&?/\s]{11})/;
	const match = url.match(regex);
	return match ? match[1] : null;
};

// --- Provider Component ---
interface MusicProviderProps {
	children: ReactNode;
}

export const MusicProvider: FC<MusicProviderProps> = ({ children }) => {
	const audioRef = useRef<HTMLAudioElement>(null);

	const [tracks, setTracks] = useState<Track[]>(mockTracks);
	const [currentTrack, setCurrentTrack] = useState<Track>(mockTracks[0]);
	const [isPlaying, setIsPlaying] = useState(false);
	const [volume, setVolume] = useState(50);
	const [isPlayerVisible, setIsPlayerVisible] = useState(false);

	const [seekPosition, setSeekPosition] = useState(0);
	const [duration, setDuration] = useState(0);

	// --- CÁC HÀM ĐIỀU KHIỂN DOM (useCallback) ---

	// Chức năng Tua bài (Sử dụng trong Logic Context)
	const handleSetSeek = useCallback(
		(time: number) => {
			const audio = audioRef.current;
			if (audio && currentTrack.type !== "YouTube") {
				audio.currentTime = time;
				setSeekPosition(time);
			}
		},
		[currentTrack.type]
	);

	// MỚI: Cập nhật hàm Phát/Tạm dừng để tương tác DOM
	const handleSetIsPlaying = useCallback(
		(playing: boolean) => {
			const audio = audioRef.current;
			setIsPlaying(playing); // Cập nhật state

			if (audio && currentTrack.type !== "YouTube") {
				if (playing) {
					// Tiếp tục từ vị trí dừng
					audio
						.play()
						.catch((e) => console.error("Autoplay chặn:", e));
				} else {
					audio.pause();
				}
			}
		},
		[currentTrack.type]
	);

	// MỚI: Hàm Replay
	const handleReplay = useCallback(() => {
		const audio = audioRef.current;
		if (audio && currentTrack.type !== "YouTube") {
			audio.currentTime = 0;
			handleSetIsPlaying(true);
		}
	}, [currentTrack.type, handleSetIsPlaying]);

	// Chức năng tua qua bài tiếp theo (Giữ nguyên)
	const handleSkipForward = useCallback(() => {
		const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
		const nextIndex = (currentIndex + 1) % tracks.length;

		if (tracks.length <= 1) {
			handleSetIsPlaying(false);
			return;
		}

		setCurrentTrack(tracks[nextIndex]);
		handleSetIsPlaying(true);
	}, [currentTrack, tracks, handleSetIsPlaying]);

	// --- LOGIC QUẢN LÝ TRACK DATA ---

	const addCustomTrack = useCallback(
		(track: Track) => {
			setTracks((prev) => [
				track,
				...prev.filter(
					(t) => t.type !== "Custom" && t.type !== "YouTube"
				),
			]);
			setCurrentTrack(track);
			handleSetIsPlaying(true);
		},
		[handleSetIsPlaying]
	);

	const deleteTrack = useCallback(
		(trackId: string) => {
			setTracks((prev) => prev.filter((t) => t.id !== trackId));
			if (currentTrack.id === trackId) {
				setCurrentTrack(mockTracks[0]);
				handleSetIsPlaying(false);
			}
		},
		[currentTrack, handleSetIsPlaying]
	);

	// MỚI: Hàm đổi tên track
	const updateTrackName = useCallback(
		(trackId: string, newName: string) => {
			setTracks((prev) =>
				prev.map((track) =>
					track.id === trackId ? { ...track, name: newName } : track
				)
			);
			if (currentTrack.id === trackId) {
				setCurrentTrack((prev) => ({ ...prev, name: newName }));
			}
		},
		[currentTrack]
	);

	const togglePlayerVisibility = useCallback((visible: boolean) => {
		setIsPlayerVisible(visible);
	}, []);

	// Hàm trả về URL YouTube cho iframe
	const getYouTubeEmbedUrl = useCallback(() => {
		if (currentTrack.type !== "YouTube") return "";
		const id = getYouTubeId(currentTrack.url);
		if (!id) return "";

		// Cần mã hóa URL để điều khiển autoplay, loop, mute
		return `https://www.youtube.com/embed/${id}?autoplay=${
			isPlaying ? 1 : 0
		}&mute=0&controls=0&disablekb=1&loop=0&playlist=${id}&enablejsapi=1`;
	}, [currentTrack, isPlaying]);

	// --- EFFECT AUDIO (Điều khiển và Listener) ---
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio || currentTrack.type === "YouTube") return;

		// 1. Cập nhật Source
		if (audio.src !== currentTrack.url) {
			audio.src = currentTrack.url;
			audio.load();
			setSeekPosition(0);
			setDuration(0);
		}

		// 2. Cập nhật Âm lượng
		audio.volume = volume / 100;

		// --- LISTENERS ---

		const updateTime = () => setSeekPosition(audio.currentTime);
		const setAudioDuration = () => setDuration(audio.duration);
		const handleTrackEnded = () => handleSkipForward();

		audio.addEventListener("timeupdate", updateTime);
		audio.addEventListener("loadedmetadata", setAudioDuration);
		audio.addEventListener("ended", handleTrackEnded);

		return () => {
			audio.removeEventListener("timeupdate", updateTime);
			audio.removeEventListener("loadedmetadata", setAudioDuration);
			audio.removeEventListener("ended", handleTrackEnded);
		};
	}, [currentTrack, volume, handleSkipForward]); // Loại bỏ isPlaying khỏi dependency

	// Giá trị Context
	const contextValue = useMemo(
		() => ({
			tracks,
			currentTrack,
			isPlaying,
			volume,
			isPlayerVisible,
			seekPosition,
			duration,
			setDuration,
			setVolume,
			setIsPlaying: handleSetIsPlaying, // THAY ĐỔI
			setCurrentTrack,
			handleSkipForward,
			handleReplay, // MỚI
			handleSetSeek,
			togglePlayerVisibility,
			addCustomTrack,
			deleteTrack,
			updateTrackName, // MỚI
			getYouTubeEmbedUrl,
		}),
		[
			tracks,
			currentTrack,
			isPlaying,
			volume,
			isPlayerVisible,
			handleSkipForward,
			handleSetSeek,
			togglePlayerVisibility,
			addCustomTrack,
			deleteTrack,
			getYouTubeEmbedUrl,
			handleSetIsPlaying,
			handleReplay,
			updateTrackName,
		]
	);

	return (
		<MusicContext.Provider value={contextValue}>
			{children}
			{/* THAY ĐỔI: Thẻ audio cố định nằm trong Provider */}
			<audio ref={audioRef} loop />
		</MusicContext.Provider>
	);
};
