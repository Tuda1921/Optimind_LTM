"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Award, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaderboardUser {
  id: string;
  name: string | null;
  email: string;
  avatar: string | null;
  level: number;
  exp: number;
  coins: number;
  rank: number;
}

export default function RankingPage() {
  const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardUser[]>([]);
  const [friendsLeaderboard, setFriendsLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch current user
      const userRes = await fetch("/api/auth/me");
      if (userRes.ok) {
        const userData = await userRes.json();
        setCurrentUser(userData.user);
      }

      // Fetch global leaderboard
      const globalRes = await fetch("/api/leaderboards?type=global&limit=50");
      if (globalRes.ok) {
        const globalData = await globalRes.json();
        setGlobalLeaderboard(globalData.leaderboard);
      }

      // Fetch friends leaderboard
      const friendsRes = await fetch("/api/leaderboards?type=friends&limit=50");
      if (friendsRes.ok) {
        const friendsData = await friendsRes.json();
        setFriendsLeaderboard(friendsData.leaderboard);
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-amber-600" />;
    return null;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "bg-yellow-500";
    if (rank === 2) return "bg-gray-400";
    if (rank === 3) return "bg-amber-600";
    return "bg-muted";
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Bảng Xếp Hạng</h1>
        <p className="text-muted-foreground">Xem thứ hạng của bạn và người khác</p>
      </div>

      {/* Current User Stats */}
      {currentUser && (
        <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={currentUser.avatar} />
                <AvatarFallback>
                  {currentUser.name?.[0] || currentUser.email[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-bold text-xl">{currentUser.name || "User"}</h3>
                <div className="flex items-center gap-4 mt-1">
                  <Badge variant="outline">Level {currentUser.level}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {currentUser.exp} EXP
                  </span>
                  <span className="text-sm text-muted-foreground">
                    💰 {currentUser.coins} Coins
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard Tabs */}
      <Tabs defaultValue="global">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="global">Toàn cầu</TabsTrigger>
          <TabsTrigger value="friends">Bạn bè</TabsTrigger>
        </TabsList>

        {/* Global Leaderboard */}
        <TabsContent value="global" className="space-y-4">
          {globalLeaderboard.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Chưa có dữ liệu
            </p>
          ) : (
            <div className="space-y-2">
              {globalLeaderboard.map((user) => (
                <Card
                  key={user.id}
                  className={cn(
                    "hover:shadow-md transition",
                    currentUser?.id === user.id && "border-primary"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className="flex items-center justify-center w-12">
                        {getRankIcon(user.rank) || (
                          <span className="text-2xl font-bold text-muted-foreground">
                            #{user.rank}
                          </span>
                        )}
                      </div>

                      {/* Avatar */}
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={user.avatar || undefined} />
                        <AvatarFallback>
                          {user.name?.[0] || user.email[0]}
                        </AvatarFallback>
                      </Avatar>

                      {/* User Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">
                            {user.name || user.email}
                          </h3>
                          {currentUser?.id === user.id && (
                            <Badge variant="outline">Bạn</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <div className="font-bold">Level {user.level}</div>
                          <div className="text-muted-foreground">Level</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold">{user.exp}</div>
                          <div className="text-muted-foreground">EXP</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold">{user.coins}</div>
                          <div className="text-muted-foreground">Coins</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Friends Leaderboard */}
        <TabsContent value="friends" className="space-y-4">
          {friendsLeaderboard.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  Chưa có bạn bè. Kết bạn để so sánh thứ hạng!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {friendsLeaderboard.map((user) => (
                <Card
                  key={user.id}
                  className={cn(
                    "hover:shadow-md transition",
                    currentUser?.id === user.id && "border-primary"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className="flex items-center justify-center w-12">
                        {getRankIcon(user.rank) || (
                          <span className="text-2xl font-bold text-muted-foreground">
                            #{user.rank}
                          </span>
                        )}
                      </div>

                      {/* Avatar */}
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={user.avatar || undefined} />
                        <AvatarFallback>
                          {user.name?.[0] || user.email[0]}
                        </AvatarFallback>
                      </Avatar>

                      {/* User Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">
                            {user.name || user.email}
                          </h3>
                          {currentUser?.id === user.id && (
                            <Badge variant="outline">Bạn</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <div className="font-bold">Level {user.level}</div>
                          <div className="text-muted-foreground">Level</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold">{user.exp}</div>
                          <div className="text-muted-foreground">EXP</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold">{user.coins}</div>
                          <div className="text-muted-foreground">Coins</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
