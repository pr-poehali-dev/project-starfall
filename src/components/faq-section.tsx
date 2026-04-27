import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function FAQSection() {
  const faqs = [
    {
      question: "Что такое STL-файл и зачем он нужен?",
      answer:
        "STL — стандартный формат для 3D-моделей, который читает любой 3D-принтер. Если у вас есть STL-файл, вы можете открыть его в слайсере (Cura, PrusaSlicer, Bambu Studio) и сразу отправить на печать.",
    },
    {
      question: "Нужно ли знать 3D-моделирование?",
      answer:
        "Нет. Просто опишите, что хотите получить, на обычном языке — например, «коробка 50x30x20 мм с крышкой на защёлках». ИИ создаст модель самостоятельно.",
    },
    {
      question: "С какими принтерами и слайсерами совместимы файлы?",
      answer:
        "Генерируемые STL-файлы совместимы со всеми FDM и SLA принтерами: Bambu Lab, Prusa, Creality, Anycubic и другими. Открываются в любом слайсере без дополнительных настроек.",
    },
    {
      question: "Насколько точны размеры модели?",
      answer:
        "Вы можете задать точные размеры в миллиметрах при описании задачи. Модели проходят автоматическую валидацию на корректность геометрии перед выдачей файла.",
    },
    {
      question: "Можно ли редактировать скачанный файл?",
      answer:
        "Да, STL-файл можно открыть в любом 3D-редакторе: Blender, Fusion 360, FreeCAD или Meshmixer. Вы получаете обычный файл без ограничений.",
    },
    {
      question: "Сколько стоит использование?",
      answer:
        "Первые генерации бесплатны. Для регулярного использования доступны гибкие тарифы. Нажмите «Попробовать бесплатно» — и начните прямо сейчас.",
    },
  ]

  return (
    <section className="py-24 bg-black">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-orbitron">Частые вопросы</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto font-space-mono">
            Ответы на популярные вопросы о генераторе STL-файлов и 3D-печати
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-red-500/20 mb-4">
                <AccordionTrigger className="text-left text-lg font-semibold text-white hover:text-red-400 font-orbitron px-6 py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-300 leading-relaxed px-6 pb-4 font-space-mono">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
