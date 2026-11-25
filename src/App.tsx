
import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import "./App.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

type Metal = {
  price: number;
  symbol: string;
};

function App() {
  const [gold, setGold] = useState<Metal | null>(null);
  const [silver, setSilver] = useState<Metal | null>(null);
  const [exchange, setExchange] = useState(0);
  const [grams, setGrams] = useState("10");
  const [selected, setSelected] = useState("gold");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [goldRes, silverRes, exchangeRes] = await Promise.all([
        fetch("/gold-api/price/XAU"),
        fetch("/gold-api/price/XAG"),
        fetch("/fx-api/latest?from=USD&to=KRW"),
      ]);

      if (!goldRes.ok) throw new Error("금 시세 요청 실패");
      if (!silverRes.ok) throw new Error("은 시세 요청 실패");
      if (!exchangeRes.ok) throw new Error("환율 요청 실패");

      const [goldData, silverData, exchangeData] = await Promise.all([
        goldRes.json(),
        silverRes.json(),
        exchangeRes.json(),
      ]);

      setGold(goldData);
      setSilver(silverData);
      setExchange(exchangeData.rates.KRW);
    } catch (err) {
      console.error("API 오류:", err);
      setError(
        err instanceof Error
          ? err.message
          : "시세 정보를 불러오지 못했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 60000);
    return () => clearInterval(timer);
  }, []);

  const currentMetal = selected === "gold" ? gold : silver;
  const gramPrice = currentMetal
    ? currentMetal.price / 31.1034768
    : 0;

  const total = gramPrice * Number(grams || 0) * exchange;

  const money = (value: number) =>
    value.toLocaleString("ko-KR", {
      maximumFractionDigits: 0,
    });

  return (
    <div className="app">
      <header className="header">
        <div className="logo">GOLD<span>WATCH</span></div>
        <div className="live">
          <span className="dot"></span> MARKET DATA
        </div>
      </header>

      <main>
        <section className="hero">
          <p className="eyebrow">PRECIOUS METALS MARKET</p>
          <h1>금과 은의 가치를<br /><span>한눈에.</span></h1>
          <p className="description">
            세계 귀금속 시세를 확인하고<br />
            나만의 자산 가치를 계산해 보세요.
          </p>
        </section>

        <section className="exchange">
          <div>
            <p>USD / KRW</p>
            <h2>{exchange ? `₩${exchange.toLocaleString("ko-KR", {
              maximumFractionDigits: 2,
            })}` : "--"}</h2>
          </div>
          <div className="exchange-icon">＄</div>
        </section>

        <div className="section-title">
          <div>
            <p className="eyebrow">LIVE MARKET</p>
            <h2>Metal Prices</h2>
          </div>
          <button className="refresh" onClick={loadData}>↻ 새로고침</button>
        </div>

        {loading && <p className="message">시세 불러오는 중...</p>}
        {error && <p className="message error">{error}</p>}

        <section className="metal-grid">
          <div className="metal-card gold-card">
            <div className="metal-top">
              <span className="metal-symbol">Au</span>
              <span className="metal-name">GOLD · XAU</span>
            </div>
            <h3>Gold</h3>
            <p className="price">
              {gold ? `$${gold.price.toLocaleString("en-US", {
                maximumFractionDigits: 2,
              })}` : "--"}
            </p>
            <p className="unit">USD / TROY OUNCE</p>
            <div className="card-bottom">
              <span>1g 기준 원화 가격</span>
              <strong>
                {gold && exchange
                  ? `₩${money(gold.price / 31.1034768 * exchange)}`
                  : "--"}
              </strong>
            </div>
          </div>

          <div className="metal-card silver-card">
            <div className="metal-top">
              <span className="metal-symbol">Ag</span>
              <span className="metal-name">SILVER · XAG</span>
            </div>
            <h3>Silver</h3>
            <p className="price">
              {silver ? `$${silver.price.toLocaleString("en-US", {
                maximumFractionDigits: 2,
              })}` : "--"}
            </p>
            <p className="unit">USD / TROY OUNCE</p>
            <div className="card-bottom">
              <span>1g 기준 원화 가격</span>
              <strong>
                {silver && exchange
                  ? `₩${money(silver.price / 31.1034768 * exchange)}`
                  : "--"}
              </strong>
            </div>
          </div>
        </section>

        <section className="calculator">
          <p className="eyebrow">VALUE CALCULATOR</p>
          <h2>나의 귀금속 가치 계산</h2>
          <p className="calc-desc">
            보유한 금속의 무게를 입력해 예상 가치를 확인하세요.
          </p>

          <div className="tabs">
            <button
              className={selected === "gold" ? "active" : ""}
              onClick={() => setSelected("gold")}
            >GOLD 금</button>
            <button
              className={selected === "silver" ? "active" : ""}
              onClick={() => setSelected("silver")}
            >SILVER 은</button>
          </div>

          <label>보유 무게 (그램)</label>
          <input
            type="number"
            min="0"
            value={grams}
            onChange={(e) => setGrams(e.target.value)}
            placeholder="무게를 입력하세요"
          />

          <div className="result">
            <span>예상 원화 가치</span>
            <h2>₩{money(total)}</h2>
            <small>국제 시세 기준 단순 환산 금액</small>
          </div>
        </section>

        <section className="calculator">
          <p className="eyebrow">MARKET COMPARISON</p>
          <h2>Gold vs Silver</h2>
          <Bar
            data={{
              labels: ["Gold", "Silver"],
              datasets: [{
                label: "USD / Troy Ounce",
                data: [gold?.price || 0, silver?.price || 0],
                backgroundColor: ["#d7ae57", "#aab5c2"],
                borderRadius: 8,
              }],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { labels: { color: "#ffffff" } },
              },
              scales: {
                x: { ticks: { color: "#ffffff" } },
                y: { ticks: { color: "#ffffff" } },
              },
            }}
          />
        </section>

        <footer>
          <div className="logo">GOLD<span>WATCH</span></div>
          <p>Market data for everyone.</p>
          <p>Data: Gold API · Frankfurter API</p>
          <p>※ 실제 매매 가격 및 세금·수수료와 다를 수 있습니다.</p>
        </footer>
      </main>
    </div>
  );
}

export default App;

 