export const DEFAULT_FEMALE_TUTOR_PHOTO = "https://i.imgur.com/Axnh9mE.png";
export const DEFAULT_FEMALE_TUTEE_PHOTO = "https://i.imgur.com/bqi2UBN.png";
export const DEFAULT_MALE_TUTOR_PHOTO = "https://i.imgur.com/jLAZm7R.png";
export const DEFAULT_MALE_TUTEE_PHOTO = "https://i.imgur.com/HHuaEy9.png";

export function getDefaultPhoto(role: string, gender: string): string {
  if (role === "tutor") {
    return gender === "female" ? DEFAULT_FEMALE_TUTOR_PHOTO : DEFAULT_MALE_TUTOR_PHOTO;
  } else if (role === "tutee") {
    return gender === "female" ? DEFAULT_FEMALE_TUTEE_PHOTO : DEFAULT_MALE_TUTEE_PHOTO;
  } else {
    return ""; // fallback if needed
  }
}