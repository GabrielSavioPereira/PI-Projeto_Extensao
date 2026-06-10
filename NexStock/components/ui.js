import React from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    ActivityIndicator,
    StyleSheet
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// ?????????????????????????????????????????
// TEMA GLOBAL
// ?????????????????????????????????????????
export const theme = {
    colors: {
        primary:      "#C97B84",
        primaryLight: "#FDECEA",
        primaryDark:  "#7a3c48",
        secondary:    "#7a5c60",
        muted:        "#b0a0a2",
        background:   "#FFF8F7",
        surface:      "#fff",
        border:       "#ecd6d7",
        danger:       "#e07b54",
        text:         "#333",
    },
    fonts: {
        regular:    "Poppins_400Regular",
        semiBold:   "Poppins_600SemiBold",
    },
    radius: {
        sm: 8,
        md: 12,
        lg: 16,
        full: 999,
    },
    shadow: {
        shadowColor:   "#C97B84",
        shadowOffset:  { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius:  6,
        elevation:     2,
    },
};

// ?????????????????????????????????????????
// SCREEN CONTAINER
// ?????????????????????????????????????????
export function ScreenContainer({ children, style }) {
    return (
        <View style={[{ flex: 1, backgroundColor: theme.colors.background }, style]}>
            {children}
        </View>
    );
}

// ?????????????????????????????????????????
// HEADER
// ?????????????????????????????????????????
export function Header({ title, subtitle, onBack, rightContent }) {
    return (
        <View style={headerStyles.container}>
            {onBack && (
                <Pressable onPress={onBack} style={headerStyles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </Pressable>
            )}
            <View style={headerStyles.textWrap}>
                <Text style={headerStyles.title}>{title}</Text>
                {subtitle ? (
                    <Text style={headerStyles.subtitle}>{subtitle}</Text>
                ) : null}
            </View>
            {rightContent ? (
                <View style={headerStyles.right}>{rightContent}</View>
            ) : (
                onBack ? <View style={{ width: 38 }} /> : null
            )}
        </View>
    );
}

const headerStyles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.primary,
        paddingTop: 52,
        paddingBottom: 18,
        paddingHorizontal: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    backBtn: {
        padding: 6,
        borderRadius: theme.radius.full,
        marginRight: 8,
    },
    textWrap: { flex: 1 },
    title: {
        fontFamily: theme.fonts.semiBold,
        fontSize: 22,
        color: "#fff",
        letterSpacing: 0.3,
    },
    subtitle: {
        fontFamily: theme.fonts.regular,
        fontSize: 13,
        color: "rgba(255,255,255,0.8)",
        marginTop: 1,
    },
    right: { marginLeft: 8 },
});

// ?????????????????????????????????????????
// SEARCH BAR (flutua sobre o header)
// ?????????????????????????????????????????
export function SearchBar({ value, onChangeText, placeholder = "Buscar..." }) {
    return (
        <View style={searchStyles.container}>
            <Ionicons
                name="search-outline"
                size={18}
                color={theme.colors.primary}
                style={{ marginRight: 8 }}
            />
            <TextInput
                style={searchStyles.input}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={theme.colors.muted}
            />
        </View>
    );
}

const searchStyles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: theme.colors.surface,
        marginHorizontal: 16,
        marginTop: -18,
        borderRadius: theme.radius.md,
        paddingHorizontal: 14,
        ...theme.shadow,
    },
    input: {
        flex: 1,
        height: 46,
        fontFamily: theme.fonts.regular,
        fontSize: 14,
        color: theme.colors.text,
    },
});

// ?????????????????????????????????????????
// CARD (surface genérica)
// ?????????????????????????????????????????
export function Card({ children, style, onPress }) {
    const inner = [cardStyles.card, style];
    if (onPress) {
        return (
            <Pressable
                style={({ pressed }) => [...inner, pressed && cardStyles.pressed]}
                onPress={onPress}
            >
                {children}
            </Pressable>
        );
    }
    return <View style={inner}>{children}</View>;
}

const cardStyles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        padding: 14,
        marginBottom: 12,
        ...theme.shadow,
    },
    pressed: { opacity: 0.85 },
});

// ?????????????????????????????????????????
// AVATAR (círculo com letra inicial)
// ?????????????????????????????????????????
export function Avatar({ nome, size = 48 }) {
    const letra = nome ? nome.charAt(0).toUpperCase() : "?";
    return (
        <View
            style={[
                avatarStyles.circle,
                { width: size, height: size, borderRadius: size / 2 },
            ]}
        >
            <Text style={[avatarStyles.letra, { fontSize: size * 0.4 }]}>
                {letra}
            </Text>
        </View>
    );
}

const avatarStyles = StyleSheet.create({
    circle: {
        backgroundColor: theme.colors.primaryLight,
        alignItems: "center",
        justifyContent: "center",
    },
    letra: {
        fontFamily: "Poppins_600SemiBold",
        color: theme.colors.primary,
        fontWeight: "bold",
    },
});

// ?????????????????????????????????????????
// SECTION LABEL (título de seção no form)
// ?????????????????????????????????????????
export function SectionLabel({ titulo, icone }) {
    return (
        <View style={sectionStyles.container}>
            <Ionicons
                name={icone}
                size={15}
                color={theme.colors.primary}
                style={{ marginRight: 6 }}
            />
            <Text style={sectionStyles.titulo}>{titulo}</Text>
        </View>
    );
}

const sectionStyles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 20,
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.primaryLight,
        paddingBottom: 6,
    },
    titulo: {
        fontFamily: theme.fonts.semiBold,
        fontSize: 12,
        color: theme.colors.primary,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
});

// ?????????????????????????????????????????
// FORM FIELD (label + TextInput)
// ?????????????????????????????????????????
export function FormField({ label, multiline, ...props }) {
    return (
        <View style={fieldStyles.container}>
            <Text style={fieldStyles.label}>{label}</Text>
            <TextInput
                style={[fieldStyles.input, multiline && fieldStyles.multiline]}
                placeholderTextColor={theme.colors.muted}
                multiline={multiline}
                textAlignVertical={multiline ? "top" : "auto"}
                {...props}
            />
        </View>
    );
}

const fieldStyles = StyleSheet.create({
    container: { marginBottom: 12 },
    label: {
        fontFamily: theme.fonts.regular,
        fontSize: 13,
        color: theme.colors.secondary,
        marginBottom: 4,
        fontWeight: "500",
    },
    input: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.md,
        paddingHorizontal: 14,
        paddingVertical: 11,
        fontFamily: theme.fonts.regular,
        fontSize: 15,
        color: theme.colors.text,
        ...theme.shadow,
    },
    multiline: {
        height: 100,
        paddingTop: 11,
    },
});

// ?????????????????????????????????????????
// PRIMARY BUTTON
// ?????????????????????????????????????????
export function PrimaryButton({ title, onPress, loading, icone, style }) {
    return (
        <Pressable
            style={({ pressed }) => [
                btnStyles.btn,
                style,
                pressed && { opacity: 0.85 },
            ]}
            onPress={onPress}
            disabled={loading}
        >
            {loading ? (
                <ActivityIndicator color="#fff" />
            ) : (
                <>
                    {icone && (
                        <Ionicons
                            name={icone}
                            size={20}
                            color="#fff"
                            style={{ marginRight: 8 }}
                        />
                    )}
                    <Text style={btnStyles.texto}>{title}</Text>
                </>
            )}
        </Pressable>
    );
}

const btnStyles = StyleSheet.create({
    btn: {
        backgroundColor: theme.colors.primary,
        borderRadius: theme.radius.md,
        paddingVertical: 15,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: theme.colors.primaryDark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    texto: {
        fontFamily: theme.fonts.semiBold,
        color: "#fff",
        fontSize: 16,
    },
});

// ?????????????????????????????????????????
// FAB (botão flutuante +)
// ?????????????????????????????????????????
export function FAB({ onPress, icone = "add" }) {
    return (
        <Pressable style={fabStyles.btn} onPress={onPress}>
            <Ionicons name={icone} size={28} color="#fff" />
        </Pressable>
    );
}

const fabStyles = StyleSheet.create({
    btn: {
        position: "absolute",
        bottom: 28,
        right: 24,
        backgroundColor: theme.colors.primary,
        width: 58,
        height: 58,
        borderRadius: 29,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: theme.colors.primaryDark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
});

// ?????????????????????????????????????????
// EMPTY STATE
// ?????????????????????????????????????????
export function EmptyState({ icone = "alert-circle-outline", mensagem }) {
    return (
        <View style={emptyStyles.container}>
            <Ionicons name={icone} size={48} color="#ddd" />
            <Text style={emptyStyles.texto}>{mensagem}</Text>
        </View>
    );
}

const emptyStyles = StyleSheet.create({
    container: { alignItems: "center", marginTop: 60 },
    texto: {
        fontFamily: theme.fonts.regular,
        color: theme.colors.muted,
        marginTop: 10,
        fontSize: 15,
        textAlign: "center",
    },
});

// ?????????????????????????????????????????
// LOADING SPINNER
// ?????????????????????????????????????????
export function Loading() {
    return (
        <ActivityIndicator
            size="large"
            color={theme.colors.primary}
            style={{ marginTop: 40 }}
        />
    );
}

// ?????????????????????????????????????????
// DELETE BUTTON (ícone lixeira)
// ?????????????????????????????????????????
export function DeleteButton({ onPress }) {
    return (
        <Pressable style={{ padding: 8 }} onPress={onPress}>
            <Ionicons name="trash-outline" size={20} color={theme.colors.primary} />
        </Pressable>
    );
}