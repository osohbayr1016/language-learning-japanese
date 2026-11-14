import AsyncStorage from "@react-native-async-storage/async-storage";
import { makeRewardOutbox } from "./rewardOutbox";

/** Non-secret learning evidence goes to durable mobile/web storage, not SecureStore. */
export const rewardOutbox = makeRewardOutbox(AsyncStorage);
