import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Security Helper: Simple Base64 encoding to avoid plain text in localStorage
const obfuscate = (str) => {
    try {
        return btoa(str);
    } catch (e) {
        return str;
    }
};

const deobfuscate = (str) => {
    try {
        return atob(str);
    } catch (e) {
        return str;
    }
};

// Helper to get users from local storage
const getStoredUsers = () => {
    try {
        const stored = localStorage.getItem('iwhistle_users');
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error("Error parsing stored users:", error);
        return [];
    }
};

// Helper to save users to local storage
const setStoredUsers = (users) => {
    try {
        localStorage.setItem('iwhistle_users', JSON.stringify(users));
    } catch (error) {
        console.error("Error saving users to storage:", error);
        toast({
            title: "Storage Error",
            description: "Failed to save user data. Local storage might be full.",
            variant: "destructive"
        });
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initialize Auth State
    useEffect(() => {
        const initAuth = async () => {
             const storedSession = localStorage.getItem('iwhistle_session');
             if (storedSession) {
                 try {
                     // Verify session integrity
                     const sessionUser = JSON.parse(storedSession);
                     const users = getStoredUsers();
                     const foundUser = users.find(u => u.id === sessionUser.id);
                     
                     if (foundUser) {
                         // Never keep password in memory state
                         const { password, ...userWithoutPassword } = foundUser;
                         setUser(userWithoutPassword);
                     } else {
                         // Session invalid - force logout
                         localStorage.removeItem('iwhistle_session');
                     }
                 } catch (e) {
                     console.error("Session restoration error:", e);
                     localStorage.removeItem('iwhistle_session');
                 }
             }
             setLoading(false);
        };
        initAuth();
    }, []);

    const login = async (email, password) => {
        setLoading(true);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));

        try {
            const users = getStoredUsers();
            
            // Check for match (comparing obfuscated password)
            const obfuscatedPassword = obfuscate(password);
            
            // We also check plain password for legacy demo accounts or if migration hasn't happened
            const foundUser = users.find(u => 
                u.email.toLowerCase() === email.toLowerCase() && 
                (u.password === obfuscatedPassword || u.password === password)
            );

            if (foundUser) {
                const { password: _, ...userWithoutPassword } = foundUser;
                setUser(userWithoutPassword);
                // Store session
                localStorage.setItem('iwhistle_session', JSON.stringify(userWithoutPassword));
                
                setLoading(false);
                return userWithoutPassword;
            }
            
            throw new Error("Invalid email or password.");
        } catch (error) {
            setLoading(false);
            throw error;
        }
    };

    const register = async (userData) => {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        
        try {
            const users = getStoredUsers();
            if (users.find(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
                 setLoading(false);
                 toast({
                    title: "Registration failed",
                    description: "An account with this email already exists.",
                    variant: "destructive",
                });
                return { success: false, error: "User already exists" };
            }

            const newUser = {
                id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                ...userData,
                password: obfuscate(userData.password), // Store obfuscated
                role: userData.role || 'referee',
                created_at: new Date().toISOString(),
                avatar_url: userData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email}`
            };

            const updatedUsers = [...users, newUser];
            setStoredUsers(updatedUsers);

            toast({
                title: "Account created! 🎉",
                description: "You can now log in with your new account.",
            });
            return { success: true };
        } catch (error) {
            console.error("Registration error:", error);
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        setUser(null);
        localStorage.removeItem('iwhistle_session');
        
        // Clear any other temporary potential sensitive items if they existed
        localStorage.removeItem('iwhistle_temp_data'); 
        
        toast({
            title: "Logged out",
            description: "See you next time! 👋",
        });
        setLoading(false);
    };

    const updateProfile = async (updates) => {
        if (!user) return;
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            const users = getStoredUsers();
            const updatedUsers = users.map(u => {
                if (u.id === user.id) {
                    // If password is being updated, obfuscate it
                    if (updates.password) {
                        return { ...u, ...updates, password: obfuscate(updates.password) };
                    }
                    return { ...u, ...updates };
                }
                return u;
            });
            
            setStoredUsers(updatedUsers);
            
            const updatedUser = updatedUsers.find(u => u.id === user.id);
            const { password: _, ...userWithoutPassword } = updatedUser;
            
            setUser(userWithoutPassword);
            localStorage.setItem('iwhistle_session', JSON.stringify(userWithoutPassword));

            toast({
                title: "Profile updated! ✅",
                description: "Your changes have been saved.",
            });
        } catch (error) {
            console.error("Update profile error:", error);
            toast({
                title: "Update failed",
                description: "Could not save profile changes.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const uploadAvatar = async (file) => {
        // Mock function
        if (!user) return;
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast({ title: "Simulator Notice", description: "File upload is simulated." });
        setLoading(false);
    };

    const createDemoAccounts = async () => {
        // This runs quickly without artificial delay to ensure smooth demo login
        try {
            const users = getStoredUsers();
            
            const demoAccounts = [
                {
                    id: 'demo-manager',
                    email: 'manager@demo.com',
                    password: obfuscate('password'), // Store encoded
                    name: 'Demo Manager',
                    role: 'manager',
                    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=manager',
                    rating: 5.0,
                    experience: '10 years',
                    phone: '+1 555 0199'
                },
                {
                    id: 'demo-referee',
                    email: 'referee@demo.com',
                    password: obfuscate('password'), // Store encoded
                    name: 'Demo Referee',
                    role: 'referee',
                    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=referee',
                    rating: 4.8,
                    experience: '3 years',
                    phone: '+1 555 0123',
                    games_officiated: 42,
                    certifications: ['Certified Official Level 1', 'NFHS Certified']
                }
            ];

            let newUsers = [...users];
            let added = false;

            demoAccounts.forEach(demoAcct => {
                if (!users.find(u => u.email === demoAcct.email)) {
                    newUsers.push(demoAcct);
                    added = true;
                }
            });

            if (added) {
                setStoredUsers(newUsers);
            }
            
            return { success: true };
        } catch (error) {
            console.error("Create demo accounts error:", error);
            return { success: false, error: error.message };
        }
    };

    const value = {
        user,
        login,
        register,
        logout,
        updateProfile,
        uploadAvatar,
        loading,
        createDemoAccounts,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};