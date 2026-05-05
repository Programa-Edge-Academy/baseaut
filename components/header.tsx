import { Settings, User } from "lucide-react-native";
import React from "react";
import { Image, View } from "react-native";

type HeaderProps = {
    logoSource?: any;
};

export function Header({ logoSource }: HeaderProps) {
    return (
        <View className="w-full items-center justify-center bg-level2 p-4">
            <View className="w-full flex-row items-center justify-between mx-4">

                <Image
                    source={logoSource ?? require("../assets/images/baseaut-logo.svg")}
                    className="h-10 w-32"
                    resizeMode="contain"
                />

                <View className="flex-row items-center">

                    <View className="ml-2 text-muted">
                        <Settings size={24} color="currentColor" />
                    </View>

                    <View className="ml-2 text-muted">
                        <User size={24} color="currentColor" />
                    </View>

                </View>

            </View>
        </View>
    );
}