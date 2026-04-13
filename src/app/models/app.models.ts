export interface ActiveUser {
        uid: string;
        email: string;
        clienteId: string;
}

export interface MenuCategory {
        id?: string;
        categoriaId?: string;
        nombre: string;
        route?: string;
        icon?: string;
        esVisible?: boolean;
        displayOrder?: number | null;
        productos?: MenuProduct[];
        [key: string]: unknown;
}

export interface MenuProduct {
        idProducto?: string;
        nombre: string;
        descripcion?: string;
        precio?: number | string | null;
        esVisible?: boolean | null;
        imagen?: string | null;
        small_imagen?: string | null;
        categoria?: MenuCategory;
        categoriaOriginalId?: string;
        nuevaImagenFile?: File | null;
        [key: string]: unknown;
}

export interface Giftcard {
        id?: string;
        de: string;
        para: string;
        valePor: string;
        estado: string;
        fechaCreacion?: Date;
        fechaUso?: Date;
        fechaExpiracion?: Date | { seconds: number; nanoseconds?: number };
        colorFondo?: string;
        colorFuente?: string;
        imagen?: string;
        [key: string]: unknown;
}
