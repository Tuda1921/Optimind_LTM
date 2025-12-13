// Tên file: app/gamification/page.jsx
"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress"; // Cần cho thanh EXP
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	LayoutDashboard,
	CheckSquare,
	Users,
	Trophy,
	BarChart2,
	Settings,
	Bell,
	User,
	Video,
	VideoOff,
	Music,
	Waves,
	Image as ImageIcon,
	X,
	Star, // Icon chính của trang
	ShoppingBag, // Icon Cửa hàng
	Bone, // Icon cho ăn
	Cookie, // Icon thức ăn
	Gem, // Icon vật phẩm
	ToyBrick, // Icon đồ chơi
	Lock, // Icon khóa
	Backpack, // MỚI: Icon túi đồ
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

// --- Dữ liệu giả lập ---
const initialPets = [
	{
		id: "hamster",
		name: "Hamster",
		level: 1,
		exp: 0,
		maxExp: 100,
		unlocked: true,
		unlockLevel: 0,
		avatar: "🐹",
	},
	{
		id: "goldfish",
		name: "Cá Vàng",
		level: 1,
		exp: 0,
		maxExp: 100,
		unlocked: false,
		unlockLevel: 5,
		avatar: "🐠",
	},
	{
		id: "cat",
		name: "Mèo",
		level: 1,
		exp: 0,
		maxExp: 100,
		unlocked: false,
		unlockLevel: 5,
		avatar: "🐱",
	},
	{
		id: "dog",
		name: "Chó",
		level: 1,
		exp: 0,
		maxExp: 100,
		unlocked: false,
		unlockLevel: 10,
		avatar: "🐶",
	},
	{
		id: "owl",
		name: "Cú",
		level: 1,
		exp: 0,
		maxExp: 100,
		unlocked: false,
		unlockLevel: 10,
		avatar: "🦉",
	},
	{
		id: "fox",
		name: "Cáo",
		level: 1,
		exp: 0,
		maxExp: 100,
		unlocked: false,
		unlockLevel: 15,
		avatar: "🦊",
	},
	{
		id: "dragon",
		name: "Rồng",
		level: 1,
		exp: 0,
		maxExp: 100,
		unlocked: false,
		unlockLevel: 20,
		avatar: "🐲",
	},
];

const shopItems = [
	{
		id: "food_small",
		name: "Thức ăn",
		type: "food",
		cost: 50,
		expGain: 20,
		icon: <Cookie />,
	},
	{
		id: "toy_ball",
		name: "Đồ chơi",
		type: "toy",
		cost: 30,
		expGain: 10,
		icon: <ToyBrick />,
	},
	{
		id: "gem_rare",
		name: "Vật phẩm hiếm",
		type: "toy",
		cost: 500,
		expGain: 0,
		icon: <Gem />,
	},
];
// --- Hết dữ liệu giả lập ---

export default function GamificationPage() {
	// === State quản lý giao diện ===
	const [backgroundUrl, setBackgroundUrl] = useState(
		"https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=2070&auto=format&fit=crop"
	);
	const [isCameraOn, setCameraOn] = useState(false);

	// === State cho Gamification ===
	const [userPoints, setUserPoints] = useState(1000); // Điểm thưởng
	const [pets, setPets] = useState(initialPets);
	const [activePetId, setActivePetId] = useState(initialPets[0].id);
	// MỚI: State cho hiệu ứng pet
	const [isPetAnimating, setPetAnimating] = useState(false);
	// MỚI: State cho túi đồ
	const [inventory, setInventory] = useState([]);

	// Hàm tiện ích
	const simpleBox = "bg-black/30 rounded-xl shadow-lg"; // Loại bỏ blur và border

	// --- HANDLERS ---
	const handleInteraction = (type) => {
		const item = shopItems.find((i) => i.type === type);
		if (!item) return;

		if (userPoints < item.cost) {
			alert("Bạn không đủ điểm!");
			return;
		}

		// MỚI: Kích hoạt hiệu ứng
		setPetAnimating(true);
		setTimeout(() => {
			setPetAnimating(false);
		}, 300); // Thời gian hiệu ứng

		// Trừ điểm
		setUserPoints((p) => p - item.cost);

		// Cập nhật Pet
		setPets((currentPets) => {
			let petToUnlockId = null;

			const updatedPets = currentPets.map((p, index) => {
				// Chỉ cập nhật pet đang active
				if (p.id === activePetId) {
					let newExp = p.exp + item.expGain;
					let newLevel = p.level;
					let newMaxExp = p.maxExp;

					// Xử lý Lên Cấp
					if (newExp >= newMaxExp) {
						newLevel++;
						newExp = newExp - newMaxExp; // Reset exp
						newMaxExp = Math.floor(newMaxExp * 1.2); // Tăng max exp
						alert(`Chúc mừng! ${p.name} đã lên Cấp ${newLevel}!`);

						// Kiểm tra xem có mở khóa pet tiếp theo không
						const nextPet = currentPets[index + 1];
						if (
							nextPet &&
							!nextPet.unlocked &&
							newLevel >= nextPet.unlockLevel
						) {
							petToUnlockId = nextPet.id;
						}
					}
					return {
						...p,
						exp: newExp,
						level: newLevel,
						maxExp: newMaxExp,
					};
				}
				return p;
			});

			// Áp dụng mở khóa (nếu có)
			if (petToUnlockId) {
				alert(
					`Bạn đã mở khóa ${
						currentPets.find((p) => p.id === petToUnlockId)?.name
					}!`
				);
				return updatedPets.map((p) =>
					p.id === petToUnlockId ? { ...p, unlocked: true } : p
				);
			}

			return updatedPets;
		});
	};

	const handleBuyItem = (item) => {
		if (userPoints < item.cost) {
			alert("Bạn không đủ điểm!");
			return;
		}
		setUserPoints((prevPoints) => prevPoints - item.cost);
		// MỚI: Thêm vào túi đồ
		setInventory((prevInventory) => [...prevInventory, item]);
		alert(`Mua ${item.name} thành công!`);
	};

	const activePet = pets.find((p) => p.id === activePetId) || pets[0];
	const previousPet = pets[pets.findIndex((p) => p.id === activePetId) - 1];

	return (
		<TooltipProvider>
			<main
				className="h-screen w-screen text-white p-6 transition-all duration-500"
				style={{
					backgroundImage: `url(${backgroundUrl})`,
					backgroundSize: "cover",
					backgroundPosition: "center",
				}}
			>
				<div className="relative w-full h-full">
					{/* === NỘI DUNG TRANG GAMIFICATION === */}
					<section
						className={cn(
							"absolute w-[900px] h-full left-1/2 -translate-x-1/2 p-6 flex flex-col gap-6",
							simpleBox // Áp dụng style mới
						)}
					>
						{/* Header: Tên trang, Điểm, Cửa hàng */}
						<div className="flex justify-between items-center">
							<h2 className="text-3xl font-bold">
								Thú Cưng Của Bạn
							</h2>
							<div className="flex items-center gap-4">
								{/* Điểm thưởng */}
								<div className="flex items-center gap-2 rounded-full bg-black/30 p-2 px-4">
									<Star className="w-5 h-5 text-yellow-400" />
									<span className="text-xl font-bold">
										{userPoints}
									</span>
								</div>

								{/* MỚI: Nút Túi Đồ (Popup) */}
								<Dialog>
									<DialogTrigger asChild>
										<Button
											className="gap-2"
											variant="outline"
										>
											<Backpack className="w-5 h-5" />
											Túi đồ
										</Button>
									</DialogTrigger>
									<DialogContent className="sm:max-w-[425px] bg-black/70 backdrop-blur-md border-white/20 text-white">
										<DialogHeader>
											<DialogTitle>
												Túi Đồ Của Bạn
											</DialogTitle>
										</DialogHeader>
										<ScrollArea className="flex flex-col gap-4 py-4 max-h-[400px]">
											{inventory.length === 0 ? (
												<p className="text-gray-400 text-center">
													Túi đồ của bạn đang trống.
												</p>
											) : (
												inventory.map((item, index) => (
													<div
														key={index} // Sử dụng index vì vật phẩm có thể trùng lặp
														className="flex items-center justify-between rounded-lg bg-white/10 p-4 mb-2"
													>
														<div className="flex items-center gap-3">
															{item.icon}
															<span className="text-lg">
																{item.name}
															</span>
														</div>
														{/* <Button size="sm">Dùng</Button> */}
													</div>
												))
											)}
										</ScrollArea>
									</DialogContent>
								</Dialog>

								{/* Nút Cửa Hàng (Popup) */}
								<Dialog>
									<DialogTrigger asChild>
										<Button className="gap-2 bg-blue-600 hover:bg-blue-700">
											<ShoppingBag className="w-5 h-5" />
											Cửa Hàng
										</Button>
									</DialogTrigger>
									<DialogContent className="sm:max-w-[425px] bg-black/70 backdrop-blur-md border-white/20 text-white">
										<DialogHeader>
											<DialogTitle>
												Cửa Hàng Vật Phẩm
											</DialogTitle>
										</DialogHeader>
										<div className="flex flex-col gap-4 py-4">
											{shopItems.map((item) => (
												<div
													key={item.id}
													className="flex items-center justify-between rounded-lg bg-white/10 p-4"
												>
													<div className="flex items-center gap-3">
														{item.icon}
														<span className="text-lg">
															{item.name}
														</span>
													</div>
													<Button
														size="sm"
														onClick={() =>
															handleBuyItem(item)
														}
													>
														Mua ({item.cost}{" "}
														<Star className="w-3 h-3 ml-1" />
														)
													</Button>
												</div>
											))}
										</div>
									</DialogContent>
								</Dialog>
							</div>
						</div>

						<Separator className="bg-white/20" />

						{/* Bố cục 2 cột: Danh sách Pet (trái) và Tương tác (phải) */}
						<div className="flex flex-1 gap-6 overflow-hidden">
							{/* Cột 1: Danh sách Pet (ĐÃ CÓ SCROLL) */}
							<div className="w-1/3 flex flex-col border-r border-white/10 pr-6">
								<h3 className="text-xl font-semibold mb-4">
									Danh sách Pet
								</h3>
								<ScrollArea className="flex-1">
									<div className="flex flex-col gap-2">
										{pets.map((pet, index) => {
											const prevPet = pets[index - 1];
											return (
												<Tooltip key={pet.id}>
													<TooltipTrigger asChild>
														<Button
															variant={
																activePetId ===
																pet.id
																	? "secondary"
																	: "ghost"
															}
															className={cn(
																"w-full h-auto justify-start gap-4 p-4",
																!pet.unlocked &&
																	"opacity-50 cursor-not-allowed"
															)}
															onClick={() =>
																pet.unlocked &&
																setActivePetId(
																	pet.id
																)
															}
														>
															<span className="text-4xl">
																{pet.avatar}
															</span>
															<div className="text-left">
																<p className="text-lg font-semibold">
																	{pet.name}
																</p>
																<p className="text-sm text-gray-300">
																	Cấp{" "}
																	{pet.level}
																</p>
															</div>
															{!pet.unlocked && (
																<Lock className="w-5 h-5 ml-auto text-gray-400" />
															)}
														</Button>
													</TooltipTrigger>
													{!pet.unlocked && (
														<TooltipContent>
															<p>
																Đạt Cấp{" "}
																{
																	pet.unlockLevel
																}{" "}
																ở{" "}
																{prevPet?.name}{" "}
																để mở khóa
															</p>
														</TooltipContent>
													)}
												</Tooltip>
											);
										})}
									</div>
								</ScrollArea>
							</div>

							{/* Cột 2: Khu vực Tương tác */}
							<div className="w-2/3 flex flex-col items-center justify-center p-6">
								{/* MỚI: Thêm hiệu ứng animation */}
								<span
									className={cn(
										"text-9xl transition-transform duration-300",
										isPetAnimating
											? "scale-125"
											: "scale-100"
									)}
								>
									{activePet.avatar}
								</span>
								<h2 className="text-5xl font-bold mt-4">
									{activePet.name}
								</h2>
								<p className="text-2xl text-gray-300">
									Cấp {activePet.level}
								</p>

								{/* Thanh EXP */}
								<div className="w-full max-w-sm space-y-2 mt-8">
									<div className="flex justify-between text-sm text-gray-300">
										<span>EXP:</span>
										<span>
											{activePet.exp} / {activePet.maxExp}
										</span>
									</div>
									<Progress
										value={
											(activePet.exp / activePet.maxExp) *
											100
										}
										className="h-4"
									/>
								</div>

								{/* Nút Hành động */}
								<div className="flex gap-4 mt-8">
									<Button
										size="lg"
										className="gap-2"
										onClick={() =>
											handleInteraction("food")
										}
									>
										<Cookie className="w-5 h-5" />
										Cho ăn (50 <Star className="w-4 h-4" />)
									</Button>
									<Button
										size="lg"
										variant="outline"
										className="gap-2 bg-transparent hover:bg-white/10"
										onClick={() => handleInteraction("toy")}
									>
										<ToyBrick className="w-5 h-5" />
										Chơi (30 <Star className="w-4 h-4" />)
									</Button>
								</div>
							</div>
						</div>
					</section>
				</div>
			</main>
		</TooltipProvider>
	);
}
