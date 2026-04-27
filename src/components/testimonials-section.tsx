import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const testimonials = [
  {
    name: "Алексей Смирнов",
    role: "Инженер-конструктор, производство электроники",
    avatar: "/cybersecurity-expert-man.jpg",
    content:
      "Раньше тратил 2-3 дня на моделирование корпуса в Fusion 360. Теперь описываю задачу — и через минуту уже отправляю на печать. Экономия колоссальная.",
  },
  {
    name: "Марина Власова",
    role: "Преподаватель технологии, школа №47",
    avatar: "/professional-woman-scientist.png",
    content:
      "Дети просто в восторге! Описывают свою идею, получают модель и сразу печатают. Никакого CAD, никакого порога входа. Уроки стали живыми.",
  },
  {
    name: "Дмитрий Ли",
    role: "Основатель мастерской 3D-печати",
    avatar: "/asian-woman-tech-developer.jpg",
    content:
      "Клиенты присылают текстовое описание детали, я генерирую STL и запускаю в печать. Количество заказов выросло втрое — больше не нужен отдельный моделлер.",
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-24 px-6 bg-card">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-card-foreground mb-4 font-sans">Что говорят пользователи</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Реальные истории людей, которые уже печатают то, что раньше было невозможно без дизайнера
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="glow-border slide-up" style={{ animationDelay: `${index * 0.15}s` }}>
              <CardContent className="p-6">
                <p className="text-card-foreground mb-6 leading-relaxed italic">"{testimonial.content}"</p>
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={testimonial.avatar || "/placeholder.svg"} alt={testimonial.name} />
                    <AvatarFallback>
                      {testimonial.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-primary">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
