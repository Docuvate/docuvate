//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'layout_ir_widget_dto.g.dart';

/// LayoutIrWidgetDto
///
/// Properties:
/// * [kind] 
/// * [page] 
/// * [x] 
/// * [y] 
/// * [width] 
/// * [height] 
/// * [value] 
/// * [checked] 
/// * [fieldName] 
/// * [rotationDeg] 
/// * [fontSizePt] 
/// * [fontFamily] 
/// * [align] 
/// * [checkMark] 
@BuiltValue()
abstract class LayoutIrWidgetDto implements Built<LayoutIrWidgetDto, LayoutIrWidgetDtoBuilder> {
  @BuiltValueField(wireName: r'kind')
  LayoutIrWidgetDtoKindEnum get kind;
  // enum kindEnum {  text,  checkbox,  };

  @BuiltValueField(wireName: r'page')
  num get page;

  @BuiltValueField(wireName: r'x')
  num get x;

  @BuiltValueField(wireName: r'y')
  num get y;

  @BuiltValueField(wireName: r'width')
  num get width;

  @BuiltValueField(wireName: r'height')
  num get height;

  @BuiltValueField(wireName: r'value')
  String? get value;

  @BuiltValueField(wireName: r'checked')
  bool? get checked;

  @BuiltValueField(wireName: r'fieldName')
  String? get fieldName;

  @BuiltValueField(wireName: r'rotationDeg')
  num? get rotationDeg;

  @BuiltValueField(wireName: r'fontSizePt')
  num? get fontSizePt;

  @BuiltValueField(wireName: r'fontFamily')
  String? get fontFamily;

  @BuiltValueField(wireName: r'align')
  String? get align;

  @BuiltValueField(wireName: r'checkMark')
  String? get checkMark;

  LayoutIrWidgetDto._();

  factory LayoutIrWidgetDto([void updates(LayoutIrWidgetDtoBuilder b)]) = _$LayoutIrWidgetDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(LayoutIrWidgetDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<LayoutIrWidgetDto> get serializer => _$LayoutIrWidgetDtoSerializer();
}

class _$LayoutIrWidgetDtoSerializer implements PrimitiveSerializer<LayoutIrWidgetDto> {
  @override
  final Iterable<Type> types = const [LayoutIrWidgetDto, _$LayoutIrWidgetDto];

  @override
  final String wireName = r'LayoutIrWidgetDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    LayoutIrWidgetDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'kind';
    yield serializers.serialize(
      object.kind,
      specifiedType: const FullType(LayoutIrWidgetDtoKindEnum),
    );
    yield r'page';
    yield serializers.serialize(
      object.page,
      specifiedType: const FullType(num),
    );
    yield r'x';
    yield serializers.serialize(
      object.x,
      specifiedType: const FullType(num),
    );
    yield r'y';
    yield serializers.serialize(
      object.y,
      specifiedType: const FullType(num),
    );
    yield r'width';
    yield serializers.serialize(
      object.width,
      specifiedType: const FullType(num),
    );
    yield r'height';
    yield serializers.serialize(
      object.height,
      specifiedType: const FullType(num),
    );
    if (object.value != null) {
      yield r'value';
      yield serializers.serialize(
        object.value,
        specifiedType: const FullType(String),
      );
    }
    if (object.checked != null) {
      yield r'checked';
      yield serializers.serialize(
        object.checked,
        specifiedType: const FullType(bool),
      );
    }
    if (object.fieldName != null) {
      yield r'fieldName';
      yield serializers.serialize(
        object.fieldName,
        specifiedType: const FullType(String),
      );
    }
    if (object.rotationDeg != null) {
      yield r'rotationDeg';
      yield serializers.serialize(
        object.rotationDeg,
        specifiedType: const FullType(num),
      );
    }
    if (object.fontSizePt != null) {
      yield r'fontSizePt';
      yield serializers.serialize(
        object.fontSizePt,
        specifiedType: const FullType(num),
      );
    }
    if (object.fontFamily != null) {
      yield r'fontFamily';
      yield serializers.serialize(
        object.fontFamily,
        specifiedType: const FullType(String),
      );
    }
    if (object.align != null) {
      yield r'align';
      yield serializers.serialize(
        object.align,
        specifiedType: const FullType(String),
      );
    }
    if (object.checkMark != null) {
      yield r'checkMark';
      yield serializers.serialize(
        object.checkMark,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    LayoutIrWidgetDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required LayoutIrWidgetDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'kind':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(LayoutIrWidgetDtoKindEnum),
          ) as LayoutIrWidgetDtoKindEnum;
          result.kind = valueDes;
          break;
        case r'page':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.page = valueDes;
          break;
        case r'x':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.x = valueDes;
          break;
        case r'y':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.y = valueDes;
          break;
        case r'width':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.width = valueDes;
          break;
        case r'height':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.height = valueDes;
          break;
        case r'value':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.value = valueDes;
          break;
        case r'checked':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.checked = valueDes;
          break;
        case r'fieldName':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.fieldName = valueDes;
          break;
        case r'rotationDeg':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.rotationDeg = valueDes;
          break;
        case r'fontSizePt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.fontSizePt = valueDes;
          break;
        case r'fontFamily':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.fontFamily = valueDes;
          break;
        case r'align':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.align = valueDes;
          break;
        case r'checkMark':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.checkMark = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  LayoutIrWidgetDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = LayoutIrWidgetDtoBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}

class LayoutIrWidgetDtoKindEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'text')
  static const LayoutIrWidgetDtoKindEnum text = _$layoutIrWidgetDtoKindEnum_text;
  @BuiltValueEnumConst(wireName: r'checkbox')
  static const LayoutIrWidgetDtoKindEnum checkbox = _$layoutIrWidgetDtoKindEnum_checkbox;

  static Serializer<LayoutIrWidgetDtoKindEnum> get serializer => _$layoutIrWidgetDtoKindEnumSerializer;

  const LayoutIrWidgetDtoKindEnum._(String name): super(name);

  static BuiltSet<LayoutIrWidgetDtoKindEnum> get values => _$layoutIrWidgetDtoKindEnumValues;
  static LayoutIrWidgetDtoKindEnum valueOf(String name) => _$layoutIrWidgetDtoKindEnumValueOf(name);
}

