import React, { useState } from "react";
import { useAuth } from "./AuthContext";

export default function UploadFile() {
  const { token } = useAuth();
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = React.useRef();

  const allowedTypes = [
    "application/pdf",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "image/jpeg",
    "image/png",
  ];
  const allowedExtensions = [".pdf", ".xls", ".xlsx", ".jpeg", ".jpg", ".png"];
  const maxFileSize = 1048576; // 1MB

  const handleChange = (e) => {
    const selectedFile = e.target.files[0];
    setMessage("");
    setUrl("");
    if (selectedFile) {
      const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf(".")).toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        setMessage("File extension not allowed.");
        setFile(null);
        return;
      }
      if (!allowedTypes.includes(selectedFile.type)) {
        setMessage("File type not allowed.");
        setFile(null);
        return;
      }
      if (selectedFile.size > maxFileSize) {
        setMessage("File size exceeds 1MB limit.");
        setFile(null);
        return;
      }
      // Valid file: reset state and set file
      setFile(selectedFile);
      setMessage("");
      setUrl("");
    } else {
      setFile(null);
    }
  };

  const handleClear = () => {
    setFile(null);
    setMessage("");
    setUrl("");
    // Clear the file input value
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage("Please select a file.");
      return;
    }
    if (!allowedTypes.includes(file.type)) {
      setMessage("File type not allowed.");
      return;
    }
    setLoading(true);
    setMessage("");
    setUrl("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/files/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const text = await res.text();
      if (res.ok) {
        setMessage("Upload successful!");
        setUrl(text.replace(/"/g, ""));
      } else {
        setMessage(text);
      }
    } catch (err) {
      setMessage("Upload failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white dark:bg-gray-900 rounded shadow text-center">
      <h2 className="text-2xl font-bold mb-4 dark:text-white">Upload File</h2>
      <form onSubmit={handleUpload}>
        <input
          ref={fileInputRef}
          id="file-input"
          type="file"
          accept=".pdf,.xls,.xlsx,image/jpeg,image/png"
          onChange={handleChange}
          className="mb-4 block w-full text-sm text-gray-700 dark:text-gray-200 dark:bg-gray-800 border dark:border-gray-700 rounded"
        />
        <div className="flex justify-center gap-2 mb-4">
          <button
            type="submit"
            disabled={loading || !file}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none"
          >
            {loading ? "Uploading..." : "Upload"}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded focus:outline-none"
            disabled={!file && !message && !url}
          >
            Clear
          </button>
        </div>
      </form>
      {message && <div className="mt-4 text-blue-700 dark:text-blue-300">{message}</div>}
      {url && (
        <div className="mt-2 break-all">
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-300 underline">
            View Uploaded File
          </a>
        </div>
      )}
    </div>
  );
}
