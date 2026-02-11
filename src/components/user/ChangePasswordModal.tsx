import React, { useEffect, useState } from "react";
import api from "../../types/api";
import API from "../../services/APIURL";
import axios from "axios";
import { useGlobalModal } from "../common/modal/GlobalModal";
interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const { showModal } = useGlobalModal()

    useEffect(() => {
        if (isOpen) {
            setCurrentPassword("");
            setNewPassword("");
            setConfirmNewPassword("");
        }
    },[isOpen])

    if (!isOpen) return null;

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage("");

        if (newPassword !== confirmNewPassword) {
            setErrorMessage("Mật khẩu nhập lại không khớp");
            return;
        }
        if (newPassword.length < 6) {
            setErrorMessage("Mật khẩu phải có ít nhất 6 ký tự");
            return;
        }

        try {
            const res = await api.post(
                `${API.changePassword}`,
                { currentPassword, newPassword },
            );

            if (res.data) {
                showModal("Đổi mật khẩu thành công!");
                onClose();
                setCurrentPassword("");
                setNewPassword("");
                setConfirmNewPassword("");
            }
        } catch (error: any) {
            if (axios.isAxiosError(error) && error.response) {
                setErrorMessage(error.response.data.message || "Không thể đổi mật khẩu");
            } else {
                setErrorMessage("Lỗi kết nối server, vui lòng thử lại sau.");
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center" onClick={onClose}>
            <div className="bg-white p-8 rounded-2xl w-full max-w-md relative shadow-xl z-50"
            onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-black"
                >
                    ✕
                </button>

                <h2 className="text-2xl font-extrabold text-center mb-6 text-yellow-500">
                    Đổi mật khẩu
                </h2>

                <form onSubmit={handleChangePassword} className="space-y-4">
                    <input
                        type="password"
                        placeholder="Mật khẩu hiện tại"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full border p-3 rounded-xl text-black"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Mật khẩu mới"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full border p-3 rounded-xl text-black"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Nhập lại mật khẩu mới"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="w-full border p-3 rounded-xl text-black"
                        required
                    />

                    {errorMessage && (
                        <p className="text-red-500 text-sm text-center">{errorMessage}</p>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-yellow-500 text-black font-semibold py-3 rounded-xl hover:opacity-90"
                    >
                        Xác nhận đổi mật khẩu
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordModal;
