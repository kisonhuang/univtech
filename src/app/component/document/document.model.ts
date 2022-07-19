export interface DocumentSafe {
    id: string;
    contents: TrustedHTML | null;
}

export interface DocumentUnsafe {
    id: string;
    contents: string | null;
}
