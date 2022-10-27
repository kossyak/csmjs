# Context State Machine (csm)

## permit
Активирует состояние, только если все элементы присутствуют в контексте.

## pop
Активирует состояние, только если все элементы присутствуют в контексте, и сразу удаляет их из контекста.

## tabu
Запрещает активацию состояния, если хотя бы один элемент из списка есть в контексте.

## push
Добавляет соответствующие элементы в контест.

## delete
Удаляет соответствующие элементы из контекста.

## set
Устанавливает новый контекст.

## text
Текстовое описание состояния.

> 🎓 Параметры каждого состояния, могут содержать один или несколько элементов. Если элементов несколько, то они должны передаваться в виде массива.

> 🎓 При активации, каждое состояние добавляется контекст, только если его там не было ранее.
