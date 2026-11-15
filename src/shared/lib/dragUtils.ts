/**
 * Утилиты для управления классом dragging-active на body
 * Используется для скрытия скроллов при перетаскивании draggable элементов
 */

export const onDragStart = () => {
  document.body.classList.add('dragging-active');
};

export const onDragStop = () => {
  document.body.classList.remove('dragging-active');
};

export const createDragHandlers = () => ({
  onStart: onDragStart,
  onStop: onDragStop,
});
