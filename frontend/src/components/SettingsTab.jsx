import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Lock, Unlock, Plus, Trash2, Calendar, Clock } from 'lucide-react';
import { useSettingsStore } from '../stores/useSettingsStore.js';

const SettingsTab = () => {
    const { settings, updateSettings } = useSettingsStore();
    
    const [formData, setFormData] = useState({
        isOpen: true,
        closedMessage: '',
        blockedDates: [],
        pickupTimes: [],
        maxBookingDays: 14
    });
    
    const [newDate, setNewDate] = useState('');
    const [newTime, setNewTime] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (settings) {
            setFormData(settings);
        }
    }, [settings]);

    const handleSave = async () => {
        setIsSaving(true);
        await updateSettings(formData);
        setIsSaving(false);
        alert("Settings updated successfully!");
    };

    const addBlockedDate = () => {
        if (newDate && !formData.blockedDates.includes(newDate)) {
            setFormData({ ...formData, blockedDates: [...formData.blockedDates, newDate] });
            setNewDate('');
        }
    };

    const removeBlockedDate = (dateToRemove) => {
        setFormData({ ...formData, blockedDates: formData.blockedDates.filter(d => d !== dateToRemove) });
    };

    const addPickupTime = () => {
        if (newTime && !formData.pickupTimes.includes(newTime)) {
            // Sort times chronologically
            const updatedTimes = [...formData.pickupTimes, newTime].sort();
            setFormData({ ...formData, pickupTimes: updatedTimes });
            setNewTime('');
        }
    };

    const removePickupTime = (timeToRemove) => {
        setFormData({ ...formData, pickupTimes: formData.pickupTimes.filter(t => t !== timeToRemove) });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
        >
            <h2 className="text-2xl font-bold text-white mb-6">Store Configuration</h2>

            {/* 1. VACATION MODE */}
            <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-white flex items-center">
                        {formData.isOpen ? <Unlock className="mr-2 text-green-400" /> : <Lock className="mr-2 text-red-400" />}
                        Store Status
                    </h3>
                    <button
                        onClick={() => setFormData({ ...formData, isOpen: !formData.isOpen })}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            formData.isOpen 
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50' 
                            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/50'
                        }`}
                    >
                        {formData.isOpen ? 'Close Store (Vacation Mode)' : 'Re-open Store'}
                    </button>
                </div>
                
                {!formData.isOpen && (
                    <div className="mt-4">
                        <label className="block text-gray-400 text-sm mb-2">Closed Message (Shown to customers)</label>
                        <textarea
                            value={formData.closedMessage}
                            onChange={(e) => setFormData({ ...formData, closedMessage: e.target.value })}
                            className="w-full bg-gray-700 text-white rounded p-3 border border-gray-600 focus:border-emerald-500 focus:outline-none"
                            rows="3"
                            placeholder="e.g., We are away for the holidays and will return on Jan 15th."
                        />
                    </div>
                )}
            </div>

            {/* 2. BLACKOUT DATES */}
            <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                    <Calendar className="mr-2 text-emerald-400" />
                    Block Specific Dates
                </h3>
                <p className="text-gray-400 text-sm mb-4">Prevent orders on specific days (Hackathons, Exams, Holidays).</p>
                
                <div className="flex gap-2 mb-4">
                    <input
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="bg-gray-700 text-white rounded p-2 border border-gray-600 flex-1"
                    />
                    <button onClick={addBlockedDate} className="bg-emerald-600 text-white p-2 rounded hover:bg-emerald-700">
                        <Plus size={20} />
                    </button>
                </div>

                <div className="flex flex-wrap gap-2">
                    {formData.blockedDates.map((date) => (
                        <div key={date} className="bg-gray-700 text-gray-200 px-3 py-1 rounded-full flex items-center text-sm border border-gray-600">
                            {date}
                            <button onClick={() => removeBlockedDate(date)} className="ml-2 text-red-400 hover:text-red-300">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                    {formData.blockedDates.length === 0 && <span className="text-gray-500 text-sm italic">No dates blocked</span>}
                </div>
            </div>

            {/* 3. PICKUP TIMES */}
            <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                    <Clock className="mr-2 text-emerald-400" />
                    Delivery / Pickup Hours
                </h3>
                
                <div className="flex gap-2 mb-4">
                    <input
                        type="time"
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                        className="bg-gray-700 text-white rounded p-2 border border-gray-600 flex-1"
                    />
                    <button onClick={addPickupTime} className="bg-emerald-600 text-white p-2 rounded hover:bg-emerald-700">
                        <Plus size={20} />
                    </button>
                </div>

                <div className="flex flex-wrap gap-2">
                    {formData.pickupTimes.map((time) => (
                        <div key={time} className="bg-gray-700 text-gray-200 px-3 py-1 rounded-full flex items-center text-sm border border-gray-600">
                            {time}
                            <button onClick={() => removePickupTime(time)} className="ml-2 text-red-400 hover:text-red-300">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* SAVE BUTTON */}
            <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center"
            >
                <Save className="mr-2" size={20} />
                {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
        </motion.div>
    );
};

export default SettingsTab;