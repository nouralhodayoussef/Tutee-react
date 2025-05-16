export const DEFAULT_FEMALE_TUTOR_PHOTO = "https://i.imgur.com/rMYtR3l.png";
export const DEFAULT_FEMALE_TUTEE_PHOTO = "https://i.imgur.com/bQT7G82.png";
export const DEFAULT_MALE_TUTOR_PHOTO = "https://i.imgur.com/HhK2Ayg.png";
export const DEFAULT_MALE_TUTEE_PHOTO = "https://i.imgur.com/2D3oCYb.png";

export function getDefaultPhoto(role: string, gender: string): string {
  if (role === "tutor") {
    return gender === "female" ? DEFAULT_FEMALE_TUTOR_PHOTO : DEFAULT_MALE_TUTOR_PHOTO;
  } else if (role === "tutee") {
    return gender === "female" ? DEFAULT_FEMALE_TUTEE_PHOTO : DEFAULT_MALE_TUTEE_PHOTO;
  } else {
    return ""; // fallback if needed
  }
}