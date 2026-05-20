import {View,Text,StyleSheet,ScrollView,TouchableOpacity,ActivityIndicator,} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { escutaProdutos } from "../services/produtoService";

export default function HomeScreen({ navigation }) {
  // Lista de produtos que vem do Firebase
  const [produtos, setProdutos] = useState([]);

  // Controla se ainda está carregando os dados
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = escutaProdutos((lista) => {
      setProdutos(lista);
      setLoading(false); // Parou de carregar
    });

    // Quando a tela fechar, para de escutar o Firebase
    return () => unsubscribe();
  }, []); 

  const categorias = produtos.reduce((acc, p) => {
    const cat = p.categoria_id ?? "Sem Categoria"; // Se não tiver categoria, usa "Sem Categoria"
    acc[cat] = (acc[cat] || 0) + 1; // Conta +1 para cada produto dessa categoria
    return acc;
  }, {});

  const categoriasArray = Object.entries(categorias).map(([nome, qtd]) => ({
    nome: String(nome),
    qtd,
  }));

  // Pega a quantidade máxima para calcular a altura das barras proporcionalmente
  const maxQtd = Math.max(...categoriasArray.map((c) => c.qtd), 1);

  // Lista de cards da home
  // disponivel: false = card ainda não tem dados reais, aparece apagado
  const CARDS = [
    {
      icon: "shirt-outline",
      label: "Total de\nProdutos",
      value: loading ? "..." : String(produtos.length), // Mostra "..." enquanto carrega
      color: "#C97B84",
      bg: "#FDECEA",
      disponivel: true, // Esse já tem dados reais do Firebase
    },
    {
      icon: "alert-circle-outline",
      label: "Estoque\nBaixo",
      value: "Em breve",
      color: "#E07B54",
      bg: "#FDF0EB",
      disponivel: false, // Ainda não implementado
    },
    {
      icon: "wallet-outline",
      label: "Saldo\nFinanceiro",
      value: "Em breve",
      color: "#7B84C9",
      bg: "#EDEAFD",
      disponivel: false, // Ainda não implementado
    },
    {
      icon: "trending-up-outline",
      label: "Vendas\nno Mês",
      value: "Em breve",
      color: "#5BA882",
      bg: "#EAFAF3",
      disponivel: false, // Ainda não implementado
    },
  ];

  return (
        
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Saudação no topo */}
      <View style={styles.greeting}>
        <Text style={styles.greetingHello}>Olá,</Text>
        <Text style={styles.greetingName}>Usuário!</Text>
      </View>

      {/* Grid de cards 2x2 */}
      <View style={styles.cardsGrid}>
        {CARDS.map((card, i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.card,
              { backgroundColor: card.bg },
              !card.disponivel && styles.cardDisabled, // Se não disponível, aplica opacidade
            ]}
            activeOpacity={card.disponivel ? 0.8 : 1} 
            onPress={() => card.disponivel && navigation.navigate("Produtos")}// Cards indisponíveis não têm efeito de toque
          >
            <Ionicons name={card.icon} size={28} color={card.color} />
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
      {/* verificar depois como fazer certinhom - PEGUEI DO CLAUDE*/}

      {/* Gráfico de barras por categoria */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Produtos por Categoria</Text>

        {/* Se ainda carregando, mostra spinner */}
        {loading ? (
          <ActivityIndicator color="#C97B84" style={{ marginTop: 20 }} />
        ) : categoriasArray.length === 0 ? (
          // Se não tiver produtos, mostra mensagem
          <Text style={styles.emptyText}>Nenhum produto cadastrado ainda.</Text>
        ) : (
          // Se tiver produtos, mostra o gráfico com scroll horizontal
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chart}>
              {categoriasArray.map((cat, i) => (
                <View key={i} style={styles.barWrapper}>
                  {/* Número em cima da barra */}
                  <Text style={styles.barValue}>{cat.qtd}</Text>

                  <View style={styles.barContainer}>
                    <View
                      style={[
                        styles.bar,
                        {
                          // Altura proporcional: categoria com mais produtos = barra maior
                          height: (cat.qtd / maxQtd) * 120,
                          // Alterna entre rosa escuro e rosa claro
                          backgroundColor: i % 2 === 0 ? "#C97B84" : "#E8A0A8",
                        },
                      ]}
                    />
                  </View>

                  {/* Nome da categoria embaixo da barra */}
                  <Text style={styles.barLabel}>{cat.nome}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF8F7" },
  content: { padding: 20, paddingBottom: 40 },
  greeting: { marginBottom: 20, marginTop: 4 },
  greetingHello: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "#b0a0a2",
  },
  greetingName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 24,
    color: "#7a3c48",
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
    borderRadius: 16,
    padding: 16,
    alignItems: "flex-start",
    gap: 8,
    shadowColor: "#C97B84",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cardDisabled: { opacity: 0.5 },
  cardValue: { fontFamily: "Poppins_600SemiBold", fontSize: 20 },
  cardLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#7a5c60",
    lineHeight: 16,
  },
  chartCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#C97B84",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  chartTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#C97B84",
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
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    color: "#C97B84",
    marginBottom: 4,
  },
  barContainer: { height: 120, justifyContent: "flex-end" },
  bar: { width: 28, borderRadius: 6 },
  barLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 9,
    color: "#7a5c60",
    marginTop: 6,
    textAlign: "center",
  },
  emptyText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#b0a0a2",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 10,
  },
});