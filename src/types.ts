export interface ServiceRequest {
    id: string;
    user_id?: string;
    session_id: string;
    service_type: 'transport' | 'workshop';
    status: 'draft' | 'pending' | 'confirmed' | 'in_process' | 'completed' | 'cancelled';
    collected_data: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface Profile {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    address: string;
    avatar_url?: string;
    role?: 'admin' | 'user';
    admin_notes: string;
    created_at: string;
}

export interface Debt {
    id: string;
    user_id?: string;
    description: string;
    amount: number;
    status: 'pending' | 'paid' | 'cancelled';
    due_date: string;
    created_at: string;
}

export interface Tariff {
    id: string;
    category: string;
    sub_category: string;
    description: string;
    price: number;
}

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    options?: string[]; // Quick replies attached to this message
}

export interface ConfirmationData {
    service_type: 'transport' | 'workshop';
    data: Record<string, any>;
}

export interface Attachment {
    id: string;
    request_id: string | null;
    user_id: string;
    file_name: string;
    file_path: string;
    file_type: string;
    file_size: number;
    created_at: string;
}

export interface Partner {
    id: string;
    name: string;
    logo_url: string;
    website_url: string;
    display_order: number;
    is_active: boolean;
}

export interface LandingLead {
    id: string;
    full_name: string;
    phone: string;
    service_type: string;
    message: string | null;
    status: string;
    created_at: string;
}

export interface Appointment {
    id: string;
    user_id: string;
    service_type: 'transport' | 'workshop';
    scheduled_at: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    payment_status?: 'pending' | 'paid_reported' | 'paid_verified' | 'rejected';
    payment_proof_url?: string | null;
    origin?: string;
    destination?: string;
    notes?: string;
    created_at: string;
}
