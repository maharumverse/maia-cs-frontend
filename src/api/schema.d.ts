export interface paths {
    "/api/v1/auth/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Identitas pengguna yang sedang masuk */
        get: operations["me_api_v1_auth_me_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Masuk dengan NIP dan kata sandi (hanya AUTH_MODE=stopgap) */
        post: operations["login_api_v1_auth_login_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Keluar dan hapus cookie sesi */
        post: operations["logout_api_v1_auth_logout_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/settings": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Pengaturan bot yang sedang berlaku */
        get: operations["get_settings_api_v1_settings_get"];
        /** Simpan pengaturan bot sebagai versi baru */
        put: operations["update_settings_api_v1_settings_put"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/settings/versions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Riwayat versi pengaturan */
        get: operations["list_versions_api_v1_settings_versions_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/settings/versions/{version}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Isi satu versi pengaturan */
        get: operations["get_version_api_v1_settings_versions__version__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/settings/versions/{version}/restore": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Kembalikan pengaturan ke versi lama */
        post: operations["restore_version_api_v1_settings_versions__version__restore_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/settings/model-test": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Tes pemanggilan satu model sebelum disimpan
         * @description Satu panggilan kecil dengan skema jawaban yang sama; tidak disimpan dan tanpa batas.
         */
        post: operations["model_test_api_v1_settings_model_test_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/audit-logs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Catatan audit tindakan admin */
        get: operations["list_audit_api_v1_audit_logs_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/knowledge/documents": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Daftar dokumen knowledge */
        get: operations["list_documents_api_v1_knowledge_documents_get"];
        put?: never;
        /** Unggah satu atau banyak berkas .md atau .txt */
        post: operations["upload_documents_api_v1_knowledge_documents_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/knowledge/documents/{document_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Detail satu dokumen */
        get: operations["get_document_api_v1_knowledge_documents__document_id__get"];
        put?: never;
        post?: never;
        /** Hapus dokumen dan section-nya */
        delete: operations["delete_document_api_v1_knowledge_documents__document_id__delete"];
        options?: never;
        head?: never;
        /** Aktifkan atau nonaktifkan dokumen */
        patch: operations["patch_document_api_v1_knowledge_documents__document_id__patch"];
        trace?: never;
    };
    "/api/v1/knowledge/documents/{document_id}/content": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Isi asli dokumen untuk preview */
        get: operations["get_content_api_v1_knowledge_documents__document_id__content_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/knowledge/documents/{document_id}/sections": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Section hasil pemecahan dokumen */
        get: operations["get_sections_api_v1_knowledge_documents__document_id__sections_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/knowledge/documents/{document_id}/reingest": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Proses ulang dokumen */
        post: operations["reingest_document_api_v1_knowledge_documents__document_id__reingest_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/knowledge/summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Total token dokumen aktif dan mode konteks yang berlaku */
        get: operations["get_summary_api_v1_knowledge_summary_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/chat/config": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Chat Config */
        get: operations["chat_config_api_v1_chat_config_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/chat/sessions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Create Session */
        post: operations["create_session_api_v1_chat_sessions_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/chat/messages": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Send Message */
        post: operations["send_message_api_v1_chat_messages_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/chat/feedback": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Feedback */
        post: operations["feedback_api_v1_chat_feedback_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/webhooks/whatsapp/meta": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Verify */
        get: operations["verify_api_v1_webhooks_whatsapp_meta_get"];
        put?: never;
        /** Receive */
        post: operations["receive_api_v1_webhooks_whatsapp_meta_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/integrations/baileys/inbound": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Inbound */
        post: operations["inbound_api_v1_integrations_baileys_inbound_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/integrations/baileys/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Status */
        post: operations["status_api_v1_integrations_baileys_status_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/channels/whatsapp/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Status
         * @description Status provider. Secret hanya ditampilkan sebagai terisi atau belum.
         */
        get: operations["status_api_v1_channels_whatsapp_status_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/channels/whatsapp/meta/test": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Test Connection */
        post: operations["test_connection_api_v1_channels_whatsapp_meta_test_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/channels/whatsapp/baileys/qr": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Baileys Qr */
        get: operations["baileys_qr_api_v1_channels_whatsapp_baileys_qr_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/channels/whatsapp/baileys/pairing-code": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Baileys Pairing Code */
        post: operations["baileys_pairing_code_api_v1_channels_whatsapp_baileys_pairing_code_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/channels/whatsapp/baileys/reconnect": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Baileys Reconnect */
        post: operations["baileys_reconnect_api_v1_channels_whatsapp_baileys_reconnect_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/channels/whatsapp/baileys/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Baileys Logout */
        post: operations["baileys_logout_api_v1_channels_whatsapp_baileys_logout_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/conversations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Daftar percakapan dengan filter */
        get: operations["list_conversations_api_v1_conversations_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/conversations/export": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Ekspor percakapan (CSV atau JSON) dengan filter yang sama */
        get: operations["export_conversations_api_v1_conversations_export_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/conversations/{conversation_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Transkrip satu percakapan beserta sitasi */
        get: operations["conversation_detail_api_v1_conversations__conversation_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/conversations/{conversation_id}/reveal-number": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Tampilkan nomor penuh (tercatat di audit) */
        post: operations["reveal_number_api_v1_conversations__conversation_id__reveal_number_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/dashboard/summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Angka ringkasan pemakaian bot */
        get: operations["summary_api_v1_dashboard_summary_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/dashboard/timeseries": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Angka harian untuk grafik */
        get: operations["timeseries_api_v1_dashboard_timeseries_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/playground/chat": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Chat uji dengan pengaturan aktif atau draf, tanpa menyimpan */
        post: operations["chat_api_v1_playground_chat_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** AuditEntry */
        AuditEntry: {
            /** Actor Nip */
            actor_nip: string;
            /** Action */
            action: string;
            /** Target Type */
            target_type: string | null;
            /** Target Id */
            target_id: string | null;
            /** Detail */
            detail: {
                [key: string]: unknown;
            } | null;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
        };
        /** AuditPage */
        AuditPage: {
            /** Items */
            items: components["schemas"]["AuditEntry"][];
            /** Total */
            total: number;
            /** Limit */
            limit: number;
            /** Offset */
            offset: number;
        };
        /** BaileysInbound */
        BaileysInbound: {
            /** Message Id */
            message_id: string;
            /** From */
            from: string;
            /** Name */
            name?: string | null;
            /** Text */
            text?: string | null;
            /**
             * Kind
             * @enum {string}
             */
            kind: "text" | "non_text";
            /** Media Type */
            media_type?: string | null;
        };
        /** BaileysStatus */
        BaileysStatus: {
            /**
             * State
             * @enum {string}
             */
            state: "connected" | "disconnected" | "error";
            /** Last Error */
            last_error?: string | null;
        };
        /** Body_upload_documents_api_v1_knowledge_documents_post */
        Body_upload_documents_api_v1_knowledge_documents_post: {
            /** Files */
            files: string[];
        };
        /** BotConfig */
        BotConfig: {
            /** System Prompt */
            system_prompt: string;
            persona?: components["schemas"]["Persona"];
            greeting: components["schemas"]["PerChannelText"];
            fallback_message: components["schemas"]["PerChannelText"];
            /** Forbidden Topics */
            forbidden_topics?: string[];
            /**
             * Context Mode
             * @default auto
             * @enum {string}
             */
            context_mode: "auto" | "full_context" | "retrieval";
            /**
             * Full Context Max Tokens
             * @default 50000
             */
            full_context_max_tokens: number;
            /**
             * Retrieval Top K
             * @default 10
             */
            retrieval_top_k: number;
            /**
             * Retrieval Threshold
             * @default 0.2
             */
            retrieval_threshold: number;
            /**
             * History Turns
             * @default 6
             */
            history_turns: number;
            /**
             * History Max Chars
             * @default 6000
             */
            history_max_chars: number;
            /**
             * Max Upload Bytes
             * @default 5000000
             */
            max_upload_bytes: number;
            /**
             * Chunk Max Chars
             * @default 1500
             */
            chunk_max_chars: number;
            /**
             * Chunk Overlap Chars
             * @default 150
             */
            chunk_overlap_chars: number;
        };
        /** BotSettings */
        "BotSettings-Input": {
            bot: components["schemas"]["BotConfig"];
            model: components["schemas"]["ModelConfig"];
            limits: components["schemas"]["LimitsConfig-Input"];
            whatsapp: components["schemas"]["WhatsAppConfig"];
            web: components["schemas"]["WebConfig"];
        };
        /** BotSettings */
        "BotSettings-Output": {
            bot: components["schemas"]["BotConfig"];
            model: components["schemas"]["ModelConfig"];
            limits: components["schemas"]["LimitsConfig-Output"];
            whatsapp: components["schemas"]["WhatsAppConfig"];
            web: components["schemas"]["WebConfig"];
        };
        /** ChannelLimits */
        ChannelLimits: {
            /**
             * Max Message Chars
             * @default 1000
             */
            max_message_chars: number;
            /**
             * Max Turns
             * @default 30
             */
            max_turns: number;
            /**
             * Per Minute
             * @default 10
             */
            per_minute: number;
            /**
             * Per Day
             * @default 100
             */
            per_day: number;
            /** Limit Message */
            limit_message: string;
        };
        /** ContentOut */
        ContentOut: {
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Title */
            title: string;
            /** Original Filename */
            original_filename: string;
            /** Content */
            content: string;
        };
        /** ConversationDetail */
        ConversationDetail: {
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Channel */
            channel: string;
            /** Provider */
            provider: string | null;
            /** Number Masked */
            number_masked: string | null;
            /** Contact Name */
            contact_name: string | null;
            /**
             * Started At
             * Format: date-time
             */
            started_at: string;
            /**
             * Last Activity At
             * Format: date-time
             */
            last_activity_at: string;
            /** Messages */
            messages: components["schemas"]["MessageOut"][];
        };
        /** ConversationItem */
        ConversationItem: {
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Channel */
            channel: string;
            /** Provider */
            provider: string | null;
            /** Number Masked */
            number_masked: string | null;
            /**
             * Started At
             * Format: date-time
             */
            started_at: string;
            /**
             * Last Activity At
             * Format: date-time
             */
            last_activity_at: string;
            /** Message Count */
            message_count: number;
            /** Fallback Count */
            fallback_count: number;
            /** Feedback Up */
            feedback_up: number;
            /** Feedback Down */
            feedback_down: number;
            /** Cost */
            cost: string;
        };
        /** ConversationPage */
        ConversationPage: {
            /** Items */
            items: components["schemas"]["ConversationItem"][];
            /** Total */
            total: number;
            /** Limit */
            limit: number;
            /** Offset */
            offset: number;
        };
        /** CostStats */
        CostStats: {
            /** Total */
            total: string;
            /** Today */
            today: string;
            /** Daily Limit */
            daily_limit: string | null;
            /** Warning */
            warning: boolean;
        };
        /** DateRange */
        DateRange: {
            /**
             * Dari
             * Format: date
             */
            dari: string;
            /**
             * Sampai
             * Format: date
             */
            sampai: string;
        };
        /** DayOut */
        DayOut: {
            /**
             * Date
             * Format: date
             */
            date: string;
            /** Conversations */
            conversations: number;
            /** User Messages */
            user_messages: number;
            /** Fallbacks */
            fallbacks: number;
            /** Cost */
            cost: string;
            /** Feedback Up */
            feedback_up: number;
            /** Feedback Down */
            feedback_down: number;
        };
        /** DocumentOut */
        DocumentOut: {
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Title */
            title: string;
            /** Original Filename */
            original_filename: string;
            /** Size Bytes */
            size_bytes: number;
            /** Token Count */
            token_count: number;
            /** Content Sha256 */
            content_sha256: string;
            /** Version */
            version: number;
            /**
             * Status
             * @enum {string}
             */
            status: "processing" | "ready" | "failed";
            /** Error Message */
            error_message: string | null;
            /** Section Count */
            section_count: number;
            /** Is Active */
            is_active: boolean;
            /** Uploaded By Nip */
            uploaded_by_nip: string;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
        };
        /** DocumentPage */
        DocumentPage: {
            /** Items */
            items: components["schemas"]["DocumentOut"][];
            /** Total */
            total: number;
            /** Limit */
            limit: number;
            /** Offset */
            offset: number;
        };
        /** DocumentPatch */
        DocumentPatch: {
            /** Is Active */
            is_active: boolean;
        };
        /** FallbackStats */
        FallbackStats: {
            /** Total */
            total: number;
            /** Rate */
            rate: number | null;
            /** By Reason */
            by_reason: {
                [key: string]: number;
            };
        };
        /** FeedbackIn */
        FeedbackIn: {
            /**
             * Message Id
             * Format: uuid
             */
            message_id: string;
            /**
             * Value
             * @enum {string}
             */
            value: "up" | "down";
        };
        /** FeedbackStats */
        FeedbackStats: {
            /** Up */
            up: number;
            /** Down */
            down: number;
            /** Rate Up */
            rate_up: number | null;
        };
        /** HTTPValidationError */
        HTTPValidationError: {
            /** Detail */
            detail?: components["schemas"]["ValidationError"][];
        };
        /** HistoryTurn */
        HistoryTurn: {
            /**
             * Role
             * @enum {string}
             */
            role: "user" | "assistant";
            /** Text */
            text: string;
        };
        /** LimitsConfig */
        "LimitsConfig-Input": {
            web: components["schemas"]["ChannelLimits"];
            whatsapp: components["schemas"]["ChannelLimits"];
            /** Daily Cost Limit */
            daily_cost_limit?: number | string | null;
        };
        /** LimitsConfig */
        "LimitsConfig-Output": {
            web: components["schemas"]["ChannelLimits"];
            whatsapp: components["schemas"]["ChannelLimits"];
            /** Daily Cost Limit */
            daily_cost_limit?: string | null;
        };
        /** LoginRequest */
        LoginRequest: {
            /** Nip */
            nip: string;
            /** Password */
            password: string;
        };
        /** MeResponse */
        MeResponse: {
            /** Nip */
            nip: string;
            /** Groups */
            groups: string[];
            /** Is Admin */
            is_admin: boolean;
        };
        /** MessageIn */
        MessageIn: {
            /** Text */
            text: string;
        };
        /** MessageOut */
        MessageOut: {
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Role */
            role: string;
            /** Text */
            text: string;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Fallback Reason */
            fallback_reason: string | null;
            /** Sources */
            sources: components["schemas"]["Source"][];
            /** Feedback */
            feedback: string | null;
            /** Model */
            model: string | null;
            /** Cost */
            cost: string | null;
            /** Input Tokens */
            input_tokens: number | null;
            /** Output Tokens */
            output_tokens: number | null;
            /** Delivery Status */
            delivery_status: string | null;
            /** Kind */
            kind: string;
        };
        /** ModelConfig */
        ModelConfig: {
            /** Primary */
            primary: string;
            /** Fallback */
            fallback?: string | null;
            /** Allowed Models */
            allowed_models: string[];
            /**
             * Temperature
             * @default 0.2
             */
            temperature: number;
            /**
             * Max Tokens
             * @default 1024
             */
            max_tokens: number;
            /**
             * Timeout Seconds
             * @default 30
             */
            timeout_seconds: number;
            /**
             * Max Retries
             * @default 2
             */
            max_retries: number;
        };
        /** ModelTestRequest */
        ModelTestRequest: {
            /** Model */
            model: string;
        };
        /** ModelTestResult */
        ModelTestResult: {
            /** Ok */
            ok: boolean;
            /** Model */
            model: string;
            /** Latency Ms */
            latency_ms: number;
            /** Cost */
            cost: string | null;
        };
        /** OperatingHours */
        OperatingHours: {
            /**
             * Enabled
             * @default false
             */
            enabled: boolean;
            /**
             * Timezone
             * @default Asia/Jakarta
             */
            timezone: string;
            /**
             * Start
             * @default 08:00
             */
            start: string;
            /**
             * End
             * @default 17:00
             */
            end: string;
            /** Days */
            days?: number[];
            /**
             * Outside Hours Message
             * @default
             */
            outside_hours_message: string;
        };
        /** PairingRequest */
        PairingRequest: {
            /** Phone */
            phone: string;
        };
        /** PerChannelText */
        PerChannelText: {
            /** Web */
            web: string;
            /** Whatsapp */
            whatsapp: string;
        };
        /**
         * Persona
         * @description Identitas bot di depan pelanggan. Aturan jujur soal AI ada di kode dan tidak bisa diubah.
         */
        Persona: {
            /**
             * Name
             * @default Maia
             */
            name: string;
            /**
             * Role
             * @default Customer Service Maharum Group
             */
            role: string;
            /**
             * Address Term
             * @default Kak
             */
            address_term: string;
            /** Traits */
            traits?: string[];
            /**
             * Speaking Style
             * @default Bahasa Indonesia santai-sopan ala admin di chat: pakai "saya", sapa pelanggan dengan sebutannya, kalimat pendek, boleh "ya", "nih", atau "baik, Kak". Hindari bahasa kaku seperti "dengan hormat" atau permintaan maaf berulang. Ikuti bahasa pelanggan: kalau mereka menulis Inggris, balas Inggris. Variasikan kalimat pembuka dan jangan mengulang kalimat yang sama di tiap balasan.
             */
            speaking_style: string;
            /**
             * Emoji
             * @default sparing
             * @enum {string}
             */
            emoji: "none" | "sparing";
        };
        /** PlaygroundRequest */
        PlaygroundRequest: {
            /** Message */
            message: string;
            /**
             * Channel
             * @enum {string}
             */
            channel: "web" | "whatsapp";
            /** History */
            history?: components["schemas"]["HistoryTurn"][];
            settings?: components["schemas"]["BotSettings-Input"] | null;
        };
        /** PlaygroundResponse */
        PlaygroundResponse: {
            /** Text */
            text: string;
            /** Fallback Reason */
            fallback_reason: string | null;
            /** Sources */
            sources: components["schemas"]["SourceOut"][];
            /** Mode */
            mode: string | null;
            /** Model */
            model: string | null;
            usage: components["schemas"]["UsageOut"] | null;
            /** Cost */
            cost: string | null;
            /**
             * Settings
             * @enum {string}
             */
            settings: "active" | "draft";
        };
        /** RestoreRequest */
        RestoreRequest: {
            /** Change Note */
            change_note?: string | null;
        };
        /** SectionOut */
        SectionOut: {
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Ref No */
            ref_no: number;
            /** Position */
            position: number;
            /** Heading Path */
            heading_path: string;
            /** Body */
            body: string;
            /** Token Count */
            token_count: number;
        };
        /** SectionPage */
        SectionPage: {
            /** Items */
            items: components["schemas"]["SectionOut"][];
            /** Total */
            total: number;
            /** Limit */
            limit: number;
            /** Offset */
            offset: number;
        };
        /** SettingsOut */
        SettingsOut: {
            /** Version */
            version: number;
            data: components["schemas"]["BotSettings-Output"];
            /** Changed By Nip */
            changed_by_nip: string | null;
            /** Change Note */
            change_note: string | null;
            /** Restored From Version */
            restored_from_version: number | null;
            /** Created At */
            created_at: string | null;
        };
        /** SettingsUpdate */
        SettingsUpdate: {
            /** Base Version */
            base_version: number;
            data: components["schemas"]["BotSettings-Input"];
            /** Change Note */
            change_note?: string | null;
        };
        /** Source */
        Source: {
            /** Ref No */
            ref_no: number;
            /** Document Title */
            document_title: string;
            /** Heading Path */
            heading_path: string;
        };
        /** SourceOut */
        SourceOut: {
            /** Ref No */
            ref_no: number;
            /** Document Title */
            document_title: string;
            /** Heading Path */
            heading_path: string;
            /** Body */
            body: string;
        };
        /** TimeseriesOut */
        TimeseriesOut: {
            range: components["schemas"]["DateRange"];
            /** Items */
            items: components["schemas"]["DayOut"][];
        };
        /** TokenStats */
        TokenStats: {
            /** Input */
            input: number;
            /** Output */
            output: number;
            /** Cache Read */
            cache_read: number;
            /** Cache Write */
            cache_write: number;
        };
        /** UploadError */
        UploadError: {
            /** Code */
            code: string;
            /** Message */
            message: string;
        };
        /** UploadResponse */
        UploadResponse: {
            /** Results */
            results: components["schemas"]["UploadResult"][];
        };
        /** UploadResult */
        UploadResult: {
            /** Filename */
            filename: string;
            /**
             * Outcome
             * @enum {string}
             */
            outcome: "created" | "updated" | "unchanged" | "rejected";
            document?: components["schemas"]["DocumentOut"] | null;
            error?: components["schemas"]["UploadError"] | null;
        };
        /** UsageOut */
        UsageOut: {
            /** Input */
            input: number;
            /** Output */
            output: number;
            /** Cache Read */
            cache_read: number;
            /** Cache Write */
            cache_write: number;
        };
        /** ValidationError */
        ValidationError: {
            /** Location */
            loc: (string | number)[];
            /** Message */
            msg: string;
            /** Error Type */
            type: string;
            /** Input */
            input?: unknown;
            /** Context */
            ctx?: Record<string, never>;
        };
        /** VersionPage */
        VersionPage: {
            /** Items */
            items: components["schemas"]["VersionSummary"][];
            /** Total */
            total: number;
            /** Limit */
            limit: number;
            /** Offset */
            offset: number;
        };
        /** VersionSummary */
        VersionSummary: {
            /** Version */
            version: number;
            /** Changed By Nip */
            changed_by_nip: string;
            /** Change Note */
            change_note: string | null;
            /** Restored From Version */
            restored_from_version: number | null;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
        };
        /** WebConfig */
        WebConfig: {
            /** Allowed Origins */
            allowed_origins?: string[];
        };
        /** WhatsAppConfig */
        WhatsAppConfig: {
            /**
             * Provider
             * @default meta
             * @enum {string}
             */
            provider: "meta" | "baileys";
            /**
             * Bot Enabled
             * @default false
             */
            bot_enabled: boolean;
            /**
             * Test Mode
             * @default true
             */
            test_mode: boolean;
            /** Allowlist */
            allowlist?: string[];
            /** Blocklist */
            blocklist?: string[];
            operating_hours?: components["schemas"]["OperatingHours"];
            /**
             * Show Sources
             * @default true
             */
            show_sources: boolean;
            /**
             * Session Timeout Hours
             * @default 24
             */
            session_timeout_hours: number;
            /**
             * Merge Delay Seconds
             * @default 3
             */
            merge_delay_seconds: number;
            /** Non Text Reply */
            non_text_reply: string;
            /**
             * Ignore Groups
             * @default true
             */
            ignore_groups: boolean;
            /**
             * Phone Number Id
             * @default
             */
            phone_number_id: string;
            /**
             * Waba Id
             * @default
             */
            waba_id: string;
            /**
             * Graph Api Version
             * @default v21.0
             */
            graph_api_version: string;
        };
        /** SummaryOut */
        app__api__v1__dashboard__SummaryOut: {
            range: components["schemas"]["DateRange"];
            /** Conversations */
            conversations: number;
            /** By Channel */
            by_channel: {
                [key: string]: number;
            };
            /** Messages In */
            messages_in: number;
            /** Answers */
            answers: number;
            /** Answered */
            answered: number;
            fallback: components["schemas"]["FallbackStats"];
            feedback: components["schemas"]["FeedbackStats"];
            cost: components["schemas"]["CostStats"];
            tokens: components["schemas"]["TokenStats"];
        };
        /** SummaryOut */
        app__api__v1__knowledge__SummaryOut: {
            /** Active Documents */
            active_documents: number;
            /** Inactive Documents */
            inactive_documents: number;
            /** Processing Documents */
            processing_documents: number;
            /** Failed Documents */
            failed_documents: number;
            /** Active Tokens */
            active_tokens: number;
            /**
             * Configured Mode
             * @enum {string}
             */
            configured_mode: "auto" | "full_context" | "retrieval";
            /**
             * Effective Mode
             * @enum {string}
             */
            effective_mode: "full_context" | "retrieval";
            /** Full Context Max Tokens */
            full_context_max_tokens: number;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    me_api_v1_auth_me_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MeResponse"];
                };
            };
        };
    };
    login_api_v1_auth_login_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LoginRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MeResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    logout_api_v1_auth_logout_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    get_settings_api_v1_settings_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SettingsOut"];
                };
            };
        };
    };
    update_settings_api_v1_settings_put: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SettingsUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SettingsOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_versions_api_v1_settings_versions_get: {
        parameters: {
            query?: {
                limit?: number;
                offset?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["VersionPage"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_version_api_v1_settings_versions__version__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                version: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SettingsOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    restore_version_api_v1_settings_versions__version__restore_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                version: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RestoreRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SettingsOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    model_test_api_v1_settings_model_test_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ModelTestRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ModelTestResult"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_audit_api_v1_audit_logs_get: {
        parameters: {
            query?: {
                actor_nip?: string | null;
                action?: string | null;
                dari?: string | null;
                sampai?: string | null;
                sort?: string;
                limit?: number;
                offset?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuditPage"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_documents_api_v1_knowledge_documents_get: {
        parameters: {
            query?: {
                q?: string | null;
                status?: ("processing" | "ready" | "failed") | null;
                is_active?: boolean | null;
                sort?: string;
                limit?: number;
                offset?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DocumentPage"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    upload_documents_api_v1_knowledge_documents_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": components["schemas"]["Body_upload_documents_api_v1_knowledge_documents_post"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UploadResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_document_api_v1_knowledge_documents__document_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                document_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DocumentOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_document_api_v1_knowledge_documents__document_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                document_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    patch_document_api_v1_knowledge_documents__document_id__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                document_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DocumentPatch"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DocumentOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_content_api_v1_knowledge_documents__document_id__content_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                document_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ContentOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_sections_api_v1_knowledge_documents__document_id__sections_get: {
        parameters: {
            query?: {
                limit?: number;
                offset?: number;
            };
            header?: never;
            path: {
                document_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SectionPage"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    reingest_document_api_v1_knowledge_documents__document_id__reingest_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                document_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DocumentOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_summary_api_v1_knowledge_summary_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["app__api__v1__knowledge__SummaryOut"];
                };
            };
        };
    };
    chat_config_api_v1_chat_config_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: string;
                    };
                };
            };
        };
    };
    create_session_api_v1_chat_sessions_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    send_message_api_v1_chat_messages_post: {
        parameters: {
            query?: never;
            header?: {
                "x-chat-session"?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["MessageIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    feedback_api_v1_chat_feedback_post: {
        parameters: {
            query?: never;
            header?: {
                "x-chat-session"?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["FeedbackIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    verify_api_v1_webhooks_whatsapp_meta_get: {
        parameters: {
            query?: {
                "hub.mode"?: string;
                "hub.verify_token"?: string;
                "hub.challenge"?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "text/plain": string;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    receive_api_v1_webhooks_whatsapp_meta_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: string;
                    };
                };
            };
        };
    };
    inbound_api_v1_integrations_baileys_inbound_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BaileysInbound"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: string;
                    };
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    status_api_v1_integrations_baileys_status_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BaileysStatus"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: string;
                    };
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    status_api_v1_channels_whatsapp_status_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    test_connection_api_v1_channels_whatsapp_meta_test_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    baileys_qr_api_v1_channels_whatsapp_baileys_qr_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    baileys_pairing_code_api_v1_channels_whatsapp_baileys_pairing_code_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PairingRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    baileys_reconnect_api_v1_channels_whatsapp_baileys_reconnect_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: string;
                    };
                };
            };
        };
    };
    baileys_logout_api_v1_channels_whatsapp_baileys_logout_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: string;
                    };
                };
            };
        };
    };
    list_conversations_api_v1_conversations_get: {
        parameters: {
            query?: {
                sort?: string;
                limit?: number;
                offset?: number;
                channel?: ("web" | "whatsapp") | null;
                dari?: string | null;
                sampai?: string | null;
                nomor?: string | null;
                fallback?: boolean | null;
                alasan?: ("not_in_document" | "invalid_citation" | "low_score" | "rate_limit" | "daily_cost_limit" | "model_error" | "forbidden_topic") | null;
                feedback?: ("up" | "down") | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ConversationPage"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    export_conversations_api_v1_conversations_export_get: {
        parameters: {
            query?: {
                format?: "csv" | "json";
                channel?: ("web" | "whatsapp") | null;
                dari?: string | null;
                sampai?: string | null;
                nomor?: string | null;
                fallback?: boolean | null;
                alasan?: ("not_in_document" | "invalid_citation" | "low_score" | "rate_limit" | "daily_cost_limit" | "model_error" | "forbidden_topic") | null;
                feedback?: ("up" | "down") | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    conversation_detail_api_v1_conversations__conversation_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                conversation_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ConversationDetail"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    reveal_number_api_v1_conversations__conversation_id__reveal_number_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                conversation_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: string | null;
                    };
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    summary_api_v1_dashboard_summary_get: {
        parameters: {
            query?: {
                dari?: string | null;
                sampai?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["app__api__v1__dashboard__SummaryOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    timeseries_api_v1_dashboard_timeseries_get: {
        parameters: {
            query?: {
                dari?: string | null;
                sampai?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TimeseriesOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    chat_api_v1_playground_chat_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PlaygroundRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PlaygroundResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
}
