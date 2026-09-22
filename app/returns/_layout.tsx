import { Stack, useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";
import { ArrowLeft } from "lucide-react-native";

export default function ReturnsLayout() {
  const router = useRouter();

  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: "Return History",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <ArrowLeft size={24} color="#1f2937" />
            </TouchableOpacity>
          )
        }} 
      />
    </Stack>
  );
}
