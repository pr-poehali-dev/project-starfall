import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const features = [
  {
    title: "Генерация из текста",
    description: "Опишите объект на русском или английском — ИИ создаст готовую 3D-модель в формате STL за секунды.",
    icon: "brain",
    badge: "ИИ",
  },
  {
    title: "Совместимость с любым слайсером",
    description: "Файлы STL работают с Cura, PrusaSlicer, Bambu Studio и любым другим программным обеспечением для 3D-печати.",
    icon: "link",
    badge: "Универсально",
  },
  {
    title: "Мгновенная загрузка",
    description: "Готовый файл скачивается в один клик. Без регистрации, без ожидания — сразу в работу.",
    icon: "zap",
    badge: "Быстро",
  },
  {
    title: "Точная геометрия",
    description: "Модели проходят автоматическую проверку: водонепроницаемость, отсутствие самопересечений и корректные нормали.",
    icon: "target",
    badge: "Качество",
  },
  {
    title: "Параметрические настройки",
    description: "Задайте точные размеры, масштаб и детализацию модели перед генерацией — результат будет именно таким, как нужно.",
    icon: "globe",
    badge: "Контроль",
  },
  {
    title: "История и библиотека",
    description: "Все сгенерированные модели сохраняются в личной библиотеке. Возвращайтесь к ним в любой момент.",
    icon: "lock",
    badge: "Удобно",
  },
]

export function FeaturesSection() {
  return (
    <section className="py-24 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4 font-sans">Всё что нужно для 3D-печати</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            От идеи до готового STL-файла — за несколько секунд
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="glow-border hover:shadow-lg transition-all duration-300 slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl">
                    {feature.icon === "brain" && "🤖"}
                    {feature.icon === "lock" && "📁"}
                    {feature.icon === "globe" && "🎛️"}
                    {feature.icon === "zap" && "⚡"}
                    {feature.icon === "link" && "🔗"}
                    {feature.icon === "target" && "🎯"}
                  </span>
                  <Badge variant="secondary" className="bg-accent text-accent-foreground">
                    {feature.badge}
                  </Badge>
                </div>
                <CardTitle className="text-xl font-bold text-card-foreground">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
