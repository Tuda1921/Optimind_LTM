// app/profile/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User,
  Pencil,
  MapPin,
  Link as LinkIcon,
  Calendar,
  Trophy,
  Brain,
  Loader2,
} from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  username: string;
  avatar?: string;
  avatarUrl?: string;
  bio?: string;
  level?: number;
  exp?: number;
  experience?: number;
  coins?: number;
  createdAt?: string;
}

interface UserStats {
  totalStudyTime: number;
  focusScore: number;
  taskCompleted: number;
  streakDays: number;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    avatarUrl: "",
  });

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setFormData({
          name: data.user.name || data.user.username,
          bio: data.user.bio || "",
          avatarUrl: data.user.avatar || data.user.avatarUrl || "",
        });
        setError("");
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setError("Không thể tải thông tin cá nhân");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/sessions/analytics?period=all");
      if (res.ok) {
        const data = await res.json();
        setStats({
          totalStudyTime: data.analytics.totalMinutes || 0,
          focusScore: data.analytics.avgFocusScore || 0,
          taskCompleted: data.analytics.totalSessions || 0,
          streakDays: 5, // This might need a separate endpoint
        });
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    
    try {
      setSaving(true);
      // Note: You may need to create a /api/auth/profile PATCH endpoint
      // For now, this is a placeholder
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          bio: formData.bio,
          avatar: formData.avatarUrl,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setIsEditing(false);
        setError("");
      }
    } catch (err) {
      console.error("Failed to save profile:", err);
      setError("Không thể cập nhật thông tin");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500">{error || "Không thể tải thông tin"}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header with Avatar */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
        <div className="flex items-end gap-6">
          <Avatar className="w-24 h-24">
            <AvatarImage
              src={profile.avatar || profile.avatarUrl}
              alt={profile.name}
            />
            <AvatarFallback>{profile.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{profile.name}</h1>
            <p className="text-blue-100">@{profile.username}</p>
            <p className="text-sm text-blue-200 mt-1">
              Joined{" "}
              {profile.createdAt
                ? new Date(profile.createdAt).toLocaleDateString("vi-VN")
                : "recently"}
            </p>
          </div>
          {!isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Study Time</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.floor(stats.totalStudyTime / 60)}h
              </div>
              <p className="text-xs text-muted-foreground">Total hours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Focus Score</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.focusScore}%</div>
              <p className="text-xs text-muted-foreground">Average</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasks Done</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.taskCompleted}</div>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Level</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile.level || 1}</div>
              <p className="text-xs text-muted-foreground">
                {profile.exp || 0} XP
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs for different sections */}
      <Tabs defaultValue="about" className="w-full">
        <TabsList>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        {/* About Tab */}
        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle>About Me</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Your name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          bio: e.target.value,
                        }))
                      }
                      placeholder="Tell us about yourself"
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="avatar">Avatar URL</Label>
                    <Input
                      id="avatar"
                      value={formData.avatarUrl}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          avatarUrl: e.target.value,
                        }))
                      }
                      placeholder="https://..."
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-red-500">{error}</p>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                    <Button
                      onClick={() => setIsEditing(false)}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-500">Bio</Label>
                    <p className="mt-2">{profile.bio || "No bio yet"}</p>
                  </div>

                  <div>
                    <Label className="text-gray-500">Email</Label>
                    <p className="mt-2">{profile.email}</p>
                  </div>

                  <div>
                    <Label className="text-gray-500">Username</Label>
                    <p className="mt-2">@{profile.username}</p>
                  </div>

                  <div>
                    <Label className="text-gray-500">Coins</Label>
                    <p className="mt-2">{profile.coins || 0} coins</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Your Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Total Study Time</p>
                      <p className="text-2xl font-bold">
                        {Math.floor(stats.totalStudyTime / 60)}h{" "}
                        {stats.totalStudyTime % 60}m
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Average Focus</p>
                      <p className="text-2xl font-bold">{stats.focusScore}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Tasks Completed</p>
                      <p className="text-2xl font-bold">{stats.taskCompleted}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Current Streak</p>
                      <p className="text-2xl font-bold">{stats.streakDays} days</p>
                    </div>
                  </div>
                </>
              ) : (
                <p>No statistics available yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
