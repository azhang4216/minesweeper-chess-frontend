import "./style.css";

const ConfirmModal = ({ message, onConfirm, onCancel, confirmText = 'Yes' }) => {
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <p>{message}</p>
                <div className="modal-buttons">
                    <button className="confirm-button" onClick={onConfirm}>{confirmText}</button>
                    {onCancel && <button className="cancel-button" onClick={onCancel}>No</button>}
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
