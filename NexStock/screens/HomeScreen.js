import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useEffect, useState } from "react";
import { escutaProdutos } from "../services/produtoService";
import {
    ScreenContainer,
    Loading,
    EmptyState,
    theme,
} from "../components/ui";

const CARDS = (totalProdutos, loading) => [
    {
        icon: "shirt-outline",
        label: "Total de\nProdutos",
        value: loading ? "..." : String(totalProdutos),
        color: "#C97B84",
        bg: "#FDECEA",
        disponivel: true,
        tela: "Produtos",
    },
    {
        icon: "alert-circle-outline",
        label: "Estoque\nBaixo",
        value: "Em breve",
        color: "#E07B54",
        bg: "#FDF0EB",
        disponivel: false,
    },
    {
        icon: "wallet-outline",
        label: "Saldo\nFinanceiro",
        value: "Em breve",
        color: "#7B84C9",
        bg: "#EDEAFD",
        disponivel: false,
    },
    {
        icon: "trending-up-outline",
        label: "Vendas\nno Mês",
        value: "Em breve",
        color: "#5BA882",
        bg: "#EAFAF3",
        disponivel: false,
    },
];

export default function HomeScreen({ navigation }) {
    const [produtos, setProdutos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = escutaProdutos((lista) => {
            setProdutos(lista);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const categorias = produtos.reduce((acc, p) => {
        const cat = p.categoria_id ?? "Sem Categoria";
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
    }, {});

    const categoriasArray = Object.entries(categorias).map(([nome, qtd]) => ({
        nome: String(nome),
        qtd,
    }));

    const maxQtd = Math.max(...categoriasArray.map((c) => c.qtd), 1);

    const cards = CARDS(produtos.length, loading);

    return (
        <ScreenContainer>
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Saudação */}
                <View style={styles.greeting}>
                    <Text style={styles.greetingHello}>Olá,</Text>
                    <Text style={styles.greetingName}>Usuário!</Text>
                </View>

                {/* Grid de cards */}
                <View style={styles.cardsGrid}>
                    {cards.map((card, i) => (
                        <TouchableOpacity
                            key={i}
                            style={[
                                styles.card,
                                { backgroundColor: card.bg },
                                !card.disponivel && styles.cardDisabled,
                            ]}
                            activeOpacity={card.disponivel ? 0.8 : 1}
                            onPress={() =>
                                card.disponivel &&
                                card.tela &&
                                navigation.navigate(card.tela)
                            }
                        >
                            <Text style={[styles.cardIcon]}>{/* ícone via Ionicons se quiser */}</Text>
                            <Text
                                style={[
                                    styles.cardValue,
                                    { color: card.disponivel ? card.color : "#ccc" },
                                ]}
                            >
                                {card.value}
                            </Text>
                            <Text style={styles.cardLabel}>{card.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Gráfico de barras */}
                <View style={styles.chartCard}>
                    <Text style={styles.chartTitle}>Produto por Categoria</Text>

                    {loading ? (
                        <Loading />
                    ) : categoriasArray.length === 0 ? (
                        <EmptyState
                            icone="bar-chart-outline"
                            mensagem="Nenhum produto cadastrado ainda."
                        />
                    ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.chart}>
                                {categoriasArray.map((cat, i) => (
                                    <View key={i} style={styles.barWrapper}>
                                        <Text style={styles.barValue}>{cat.qtd}</Text>
                                        <View style={styles.barContainer}>
                                            <View
                                                style={[
                                                    styles.bar,
                                                    {
                                                        height: (cat.qtd / maxQtd) * 120,
                                                        backgroundColor:
                                                            i % 2 === 0 ? "#C97B84" : "#E8A0A8",
                                                    },
                                                ]}
                                            />
                                        </View>
                                        <Text style={styles.barLabel}>{cat.nome}</Text>
                                    </View>
                                ))}
                            </View>
                        </ScrollView>
                    )}
                </View>
            </ScrollView>
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    content: { padding: 20, paddingBottom: 40 },

    greeting: { marginBottom: 20, marginTop: 4 },
    greetingHello: {
        fontFamily: theme.fonts.regular,
        fontSize: 16,
        color: theme.colors.muted,
    },
    greetingName: {
        fontFamily: theme.fonts.semiBold,
        fontSize: 24,
        color: theme.colors.primaryDark,
        marginTop: -4,
    },

    cardsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 24,
    },
    card: {
        width: "47%",
        borderRadius: theme.radius.lg,
        padding: 16,
        alignItems: "flex-start",
        gap: 8,
        ...theme.shadow,
    },
    cardDisabled: { opacity: 0.5 },
    cardValue: { fontFamily: theme.fonts.semiBold, fontSize: 20 },
    cardLabel: {
        fontFamily: theme.fonts.regular,
        fontSize: 12,
        color: theme.colors.secondary,
        lineHeight: 16,
    },

    chartCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        padding: 16,
        ...theme.shadow,
    },
    chartTitle: {
        fontFamily: theme.fonts.semiBold,
        fontSize: 15,
        color: theme.colors.primary,
        marginBottom: 16,
    },
    chart: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 8,
        paddingBottom: 4,
    },
    barWrapper: { alignItems: "center", width: 52 },
    barValue: {
        fontFamily: theme.fonts.semiBold,
        fontSize: 11,
        color: theme.colors.primary,
        marginBottom: 4,
    },
    barContainer: { height: 120, justifyContent: "flex-end" },
    bar: { width: 28, borderRadius: 6 },
    barLabel: {
        fontFamily: theme.fonts.regular,
        fontSize: 9,
        color: theme.colors.secondary,
        marginTop: 6,
        textAlign: "center",
    },
});