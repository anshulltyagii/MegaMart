import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Trash2,
  Star,
  StarOff,
  Loader2,
  UploadCloud,
} from "lucide-react";
import { productImageAPI } from "../../services/api";

export default function ProductImagesPremium() {
  const { productId } = useParams();

  const [images, setImages] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const BASE_URL = "http://localhost:9192"; // backend base URL

  const resolveImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${BASE_URL}${path}`;
  };

  useEffect(() => {
    loadImages();
  }, [productId]);

  const loadImages = async () => {
    try {
      const res = await productImageAPI.getImages(productId);
      setImages(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setUploadQueue(files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    setUploadQueue(files);
  };

  const uploadAll = async () => {
    if (uploadQueue.length === 0) return;
    setUploading(true);

    for (const file of uploadQueue) {
      try {
        await productImageAPI.upload(productId, file);
      } catch (e) {
        console.log("Upload error", e);
      }
    }

    setUploadQueue([]);
    loadImages();
    setUploading(false);
  };

  const removeImage = async (imageId) => {
    if (!window.confirm("Delete this image?")) return;
    await productImageAPI.delete(imageId);
    loadImages();
  };

  const setPrimary = async (imageId) => {
    await productImageAPI.setPrimary(imageId, productId);
    loadImages();
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-6">Product Images</h2>

      {/* DRAG UPLOAD BOX */}
      <div
        className={`border-2 border-dashed p-10 rounded-2xl transition-all bg-white shadow-sm cursor-pointer 
        ${dragActive ? "border-indigo-600 bg-indigo-50" : "border-gray-300"}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById("fileInput").click()}
      >
        <div className="flex flex-col items-center">
          {uploading ? (
            <Loader2 size={40} className="animate-spin text-indigo-600 mb-3" />
          ) : (
            <UploadCloud size={50} className="text-indigo-600 mb-3" />
          )}

          <p className="text-lg font-semibold">
            Drag & Drop images here or{" "}
            <span className="text-indigo-600 underline">browse</span>
          </p>

          <input
            id="fileInput"
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      </div>

      {/* UPLOAD QUEUE PREVIEW */}
      {uploadQueue.length > 0 && (
        <div className="mt-6 p-4 bg-white border rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold mb-3">Selected Images</h3>

          <div className="flex gap-4 overflow-x-auto">
            {uploadQueue.map((file, index) => (
              <div
                key={index}
                className="w-28 h-28 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden shadow"
              >
                <img
                  src={URL.createObjectURL(file)}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>

          <button
            onClick={uploadAll}
            className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg shadow hover:bg-indigo-700"
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Upload All"}
          </button>
        </div>
      )}

      {/* IMAGE GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-8">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div
              key={i}
              className="w-full h-56 bg-gray-200 animate-pulse rounded-xl"
            ></div>
          ))
        ) : images.length === 0 ? (
          <p className="text-gray-500 text-center col-span-full mt-4">
            No images uploaded yet.
          </p>
        ) : (
          images.map((img) => (
            <div
              key={img.id}
              className="relative bg-white border rounded-xl shadow hover:shadow-lg transition overflow-hidden"
            >
              {img.primary && (
                <span className="absolute top-3 left-3 bg-yellow-500 text-white px-3 py-1 text-xs rounded-full shadow">
                  Primary
                </span>
              )}

              <img
                src={resolveImageUrl(img.imagePath)}
                className="w-full h-56 object-cover"
              />

              <div className="p-4 flex items-center justify-between bg-gray-50 border-t">

                {/* PRIMARY BUTTON */}
                <button
                  onClick={() => setPrimary(img.id)}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg ${
                    img.primary
                      ? "text-yellow-600 bg-yellow-100"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {img.primary ? <Star size={18} /> : <StarOff size={18} />}
                  {img.primary ? "Primary" : "Make Primary"}
                </button>

                {/* DELETE BUTTON */}
                <button
                  onClick={() => removeImage(img.id)}
                  className="text-red-600 hover:bg-red-100 p-2 rounded-lg"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}