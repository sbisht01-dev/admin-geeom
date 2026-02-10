import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { ref, onValue, update } from "firebase/database";
import './AdminContact.css';

const AdminContact = () => {
    const [formData, setFormData] = useState({
        // Contact Info
        addressLine1: '',
        addressLine2: '',
        addressLine3: '',
        email: '',
        phone: '',
        whatsapp: '',
        // Business Hours
        weekdays: '',
        saturday: '',
        sunday: ''
    });
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        // References to the specific nodes in your JSON structure
        const contactRef = ref(db, 'contact_info');
        const hoursRef = ref(db, 'business_hours');

        const unsubscribeContact = onValue(contactRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setFormData(prev => ({
                    ...prev,
                    addressLine1: data.addressLine1 || '',
                    addressLine2: data.addressLine2 || '',
                    addressLine3: data.addressLine3 || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    whatsapp: data.whatsapp || ''
                }));
            }
        });

        const unsubscribeHours = onValue(hoursRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setFormData(prev => ({
                    ...prev,
                    weekdays: data.weekdays || '',
                    saturday: data.saturday || '',
                    sunday: data.sunday || ''
                }));
            }
            setLoading(false);
        });

        return () => {
            unsubscribeContact();
            unsubscribeHours();
        };
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        const contactUpdates = {
            addressLine1: formData.addressLine1,
            addressLine2: formData.addressLine2,
            addressLine3: formData.addressLine3,
            email: formData.email,
            phone: formData.phone,
            whatsapp: formData.whatsapp,
        };

        const hourUpdates = {
            weekdays: formData.weekdays,
            saturday: formData.saturday,
            sunday: formData.sunday,
        };

        try {
            await update(ref(db, 'contact_info'), contactUpdates);
            await update(ref(db, 'business_hours'), hourUpdates);
            alert("Contact details updated successfully!");
        } catch (error) {
            console.error("Update Error:", error);
            alert("Failed to update details.");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div className="admin-loader">Loading details...</div>;

    return (
        <div className="admin-contact-wrapper">
            <h2 className="admin-section-title">Edit Contact & Hours</h2>
            
            <form onSubmit={handleSave} className="admin-contact-form">
                
                <div className="form-section">
                    <h3>📍 Address Details</h3>
                    <div className="admin-input-group">
                        <label>Address Line 1</label>
                        <input type="text" name="addressLine1" value={formData.addressLine1} onChange={handleChange} placeholder="Building/Street" />
                    </div>
                    <div className="admin-input-group">
                        <label>Address Line 2</label>
                        <input type="text" name="addressLine2" value={formData.addressLine2} onChange={handleChange} placeholder="Locality" />
                    </div>
                    <div className="admin-input-group">
                        <label>Address Line 3</label>
                        <input type="text" name="addressLine3" value={formData.addressLine3} onChange={handleChange} placeholder="City, State, Zip" />
                    </div>
                </div>

                <div className="form-section">
                    <h3>📞 Communication</h3>
                    <div className="admin-input-group">
                        <label>Email Address</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} />
                    </div>
                    <div className="admin-input-group">
                        <label>Phone Number</label>
                        <input type="text" name="phone" value={formData.phone} onChange={handleChange} />
                    </div>
                    <div className="admin-input-group">
                        <label>WhatsApp Number</label>
                        <input type="text" name="whatsapp" value={formData.whatsapp} onChange={handleChange} />
                    </div>
                </div>

                <div className="form-section">
                    <h3>⏰ Business Hours</h3>
                    <div className="admin-input-group">
                        <label>Weekdays</label>
                        <input type="text" name="weekdays" value={formData.weekdays} onChange={handleChange} placeholder="e.g. 9:00 AM - 6:00 PM" />
                    </div>
                    <div className="admin-input-group">
                        <label>Saturday</label>
                        <input type="text" name="saturday" value={formData.saturday} onChange={handleChange} />
                    </div>
                    <div className="admin-input-group">
                        <label>Sunday</label>
                        <input type="text" name="sunday" value={formData.sunday} onChange={handleChange} />
                    </div>
                </div>

                <button type="submit" className="admin-save-btn" disabled={isSaving}>
                    {isSaving ? "Saving Changes..." : "Update All Details"}
                </button>
            </form>
        </div>
    );
};

export default AdminContact;