import { createSocialImage, SOCIAL_IMAGE_SIZE } from "@/app/social-image";

export const alt = "DigiBoard split-flap display";
export const size = SOCIAL_IMAGE_SIZE;
export const contentType = "image/png";

export default function TwitterImage() {
  return createSocialImage();
}
