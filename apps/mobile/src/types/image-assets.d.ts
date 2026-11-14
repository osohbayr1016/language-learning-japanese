/** Expo/Metro imports return asset IDs; Vite may return resolved URLs. */
declare module "*.png" {
  const asset: string | number;
  export default asset;
}
