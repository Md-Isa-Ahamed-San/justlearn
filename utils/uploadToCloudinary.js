
export const uploadToCloudinary = async (file) => {
    console.log(" uploadToCloudinary ~ file:", file)
    const cloudName = process.env.NEXT_PUBLIC_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET;
    const folderName = process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER;

   
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", folderName);
  
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });
  
      if (!res.ok) {
        throw new Error("Cloudinary upload failed");
      }
  
      const data = await res.json();
      console.log("Cloudinary Upload Response:", data?.secure_url);
      return data.secure_url;
    } catch (error) {
      console.error("Cloudinary Upload Error:", error);
      throw error;
    }
  };
  