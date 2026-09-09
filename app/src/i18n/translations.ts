export type Locale = 'ar' | 'en';

export const translations = {
  nav: { dashboard: ['لوحة التحكم', 'Dashboard'], clients: ['العملاء والمناسبات', 'Clients & Events'], workshops: ['ورش العمل', 'Workshops'] },
  common: {
    add: ['إضافة', 'Add'],
    edit: ['تعديل', 'Edit'],
    delete: ['حذف', 'Delete'],
    save: ['حفظ', 'Save'],
    cancel: ['إلغاء', 'Cancel'],
    exportPdf: ['تصدير PDF', 'Export PDF'],
    date: ['التاريخ', 'Date'],
    time: ['الوقت', 'Time'],
    participants: ['عدد الأشخاص', 'Participants'],
    location: ['المكان', 'Location'],
    materials: ['المستلزمات', 'Materials'],
    missing: ['ناقص', 'Missing'],
    available: ['متوفر', 'Available'],
    prepared: ['تم التجهيز', 'Prepared'],
    loading: ['...جارِ التحميل', 'Loading...'],
    saving: ['...جارِ الحفظ', 'Saving...'],
    deleting: ['...جارِ الحذف', 'Deleting...'],
    close: ['إغلاق', 'Close'],
    notes: ['ملاحظات', 'Notes'],
    optional: ['اختياري', 'optional'],
    required: ['هذا الحقل مطلوب', 'This field is required'],
    saveFailed: ['تعذر حفظ البيانات، حاول مرة أخرى', 'Could not save, please try again'],
    deleteFailed: ['تعذر الحذف، حاول مرة أخرى', 'Could not delete, please try again'],
    loadFailed: ['تعذر تحميل البيانات، حاول مرة أخرى', 'Could not load data, please try again'],
    confirmDeleteTitle: ['حذف السجل', 'Confirm Delete'],
    noResults: ['لا توجد نتائج', 'No results'],
  },
  workshop: {
    addWorkshop: ['+ إضافة ورشة', '+ Add Workshop'],
    editWorkshop: ['تعديل الورشة', 'Edit Workshop'],
    nameAr: ['اسم الورشة (عربي)', 'Workshop Name (Arabic)'],
    nameEn: ['اسم الورشة (إنجليزي)', 'Workshop Name (English)'],
    descriptionAr: ['الوصف (عربي)', 'Description (Arabic)'],
    descriptionEn: ['الوصف (إنجليزي)', 'Description (English)'],
    image: ['صورة/مرجع الورشة', 'Workshop reference image'],
    startTime: ['وقت البداية', 'Start time'],
    endTime: ['وقت النهاية', 'End time'],
    locationNotes: ['ملاحظات المكان', 'Location notes'],
    internalNotes: ['ملاحظات داخلية', 'Internal notes'],
    status: ['حالة الورشة', 'Status'],
    materialsReady: ['من المستلزمات جاهزة', 'materials ready'],
    noWorkshops: ['لا توجد ورش عمل بعد.', 'No workshops yet.'],
    concept: ['فكرة الورشة', 'Workshop concept'],
    information: ['معلومات الورشة', 'Workshop Information'],
    preparation: ['حالة التجهيز', 'Preparation Status'],
    totalMaterials: ['إجمالي المستلزمات', 'Total materials'],
    addMaterial: ['+ إضافة مستلزم', '+ Add Material'],
    editMaterial: ['تعديل المستلزم', 'Edit Material'],
    materialNameAr: ['اسم المستلزم (عربي)', 'Material Name (Arabic)'],
    materialNameEn: ['اسم المستلزم (إنجليزي)', 'Material Name (English)'],
    quantity: ['الكمية المطلوبة', 'Required quantity'],
    unit: ['الوحدة', 'Unit'],
    noMaterials: ['لا توجد مستلزمات مضافة بعد.', 'No materials added yet.'],
    deleteWorkshopConfirm: [
      'سيتم حذف الورشة وجميع مستلزماتها نهائياً. هل تريد المتابعة؟',
      'This will permanently delete the workshop and all its materials. Continue?',
    ],
    deleteMaterialConfirm: ['سيتم حذف هذا المستلزم نهائياً. هل تريد المتابعة؟', 'This will permanently delete this material. Continue?'],
    missingMaterials: ['المستلزمات الناقصة', 'Missing Materials'],
    preparationSheet: ['ورقة تجهيز الورشة', 'Workshop Preparation Sheet'],
  },
  status: {
    'مسودة': ['مسودة', 'Draft'],
    'قيد التجهيز': ['قيد التجهيز', 'Preparing'],
    'جاهزة': ['جاهزة', 'Ready'],
    'مكتملة': ['مكتملة', 'Completed'],
  },
} as const;

type Section = keyof typeof translations;

export function translate(locale: Locale, section: Section, key: string): string {
  const idx = locale === 'ar' ? 0 : 1;
  const sectionDict = translations[section] as Record<string, readonly [string, string]>;
  return sectionDict[key]?.[idx] ?? key;
}
