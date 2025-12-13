"use client";

type Props = {
  userId: string;
  avatarUrl?: string;
};

export default function ProfileImageUploader({ avatarUrl }: Props) {
  return (
    <div className="profile-image-uploader">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt="Profile avatar"
          className="h-24 w-24 rounded-full object-cover"
        />
      ) : (
        <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center text-sm text-gray-500">
          No Image
        </div>
      )}
    </div>
  );
}
