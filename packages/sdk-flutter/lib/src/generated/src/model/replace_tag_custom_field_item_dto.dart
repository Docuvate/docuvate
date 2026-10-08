//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'replace_tag_custom_field_item_dto.g.dart';

/// ReplaceTagCustomFieldItemDto
///
/// Properties:
/// * [key] 
/// * [label] 
/// * [fieldType] 
/// * [sortOrder] 
@BuiltValue()
abstract class ReplaceTagCustomFieldItemDto implements Built<ReplaceTagCustomFieldItemDto, ReplaceTagCustomFieldItemDtoBuilder> {
  @BuiltValueField(wireName: r'key')
  String get key;

  @BuiltValueField(wireName: r'label')
  String get label;

  @BuiltValueField(wireName: r'fieldType')
  ReplaceTagCustomFieldItemDtoFieldTypeEnum? get fieldType;
  // enum fieldTypeEnum {  text,  date,  number,  currency,  };

  @BuiltValueField(wireName: r'sortOrder')
  num? get sortOrder;

  ReplaceTagCustomFieldItemDto._();

  factory ReplaceTagCustomFieldItemDto([void updates(ReplaceTagCustomFieldItemDtoBuilder b)]) = _$ReplaceTagCustomFieldItemDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ReplaceTagCustomFieldItemDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ReplaceTagCustomFieldItemDto> get serializer => _$ReplaceTagCustomFieldItemDtoSerializer();
}

class _$ReplaceTagCustomFieldItemDtoSerializer implements PrimitiveSerializer<ReplaceTagCustomFieldItemDto> {
  @override
  final Iterable<Type> types = const [ReplaceTagCustomFieldItemDto, _$ReplaceTagCustomFieldItemDto];

  @override
  final String wireName = r'ReplaceTagCustomFieldItemDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ReplaceTagCustomFieldItemDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'key';
    yield serializers.serialize(
      object.key,
      specifiedType: const FullType(String),
    );
    yield r'label';
    yield serializers.serialize(
      object.label,
      specifiedType: const FullType(String),
    );
    if (object.fieldType != null) {
      yield r'fieldType';
      yield serializers.serialize(
        object.fieldType,
        specifiedType: const FullType(ReplaceTagCustomFieldItemDtoFieldTypeEnum),
      );
    }
    if (object.sortOrder != null) {
      yield r'sortOrder';
      yield serializers.serialize(
        object.sortOrder,
        specifiedType: const FullType(num),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    ReplaceTagCustomFieldItemDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ReplaceTagCustomFieldItemDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'key':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.key = valueDes;
          break;
        case r'label':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.label = valueDes;
          break;
        case r'fieldType':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ReplaceTagCustomFieldItemDtoFieldTypeEnum),
          ) as ReplaceTagCustomFieldItemDtoFieldTypeEnum;
          result.fieldType = valueDes;
          break;
        case r'sortOrder':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.sortOrder = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ReplaceTagCustomFieldItemDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ReplaceTagCustomFieldItemDtoBuilder();
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

class ReplaceTagCustomFieldItemDtoFieldTypeEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'text')
  static const ReplaceTagCustomFieldItemDtoFieldTypeEnum text = _$replaceTagCustomFieldItemDtoFieldTypeEnum_text;
  @BuiltValueEnumConst(wireName: r'date')
  static const ReplaceTagCustomFieldItemDtoFieldTypeEnum date = _$replaceTagCustomFieldItemDtoFieldTypeEnum_date;
  @BuiltValueEnumConst(wireName: r'number')
  static const ReplaceTagCustomFieldItemDtoFieldTypeEnum number = _$replaceTagCustomFieldItemDtoFieldTypeEnum_number;
  @BuiltValueEnumConst(wireName: r'currency')
  static const ReplaceTagCustomFieldItemDtoFieldTypeEnum currency = _$replaceTagCustomFieldItemDtoFieldTypeEnum_currency;

  static Serializer<ReplaceTagCustomFieldItemDtoFieldTypeEnum> get serializer => _$replaceTagCustomFieldItemDtoFieldTypeEnumSerializer;

  const ReplaceTagCustomFieldItemDtoFieldTypeEnum._(String name): super(name);

  static BuiltSet<ReplaceTagCustomFieldItemDtoFieldTypeEnum> get values => _$replaceTagCustomFieldItemDtoFieldTypeEnumValues;
  static ReplaceTagCustomFieldItemDtoFieldTypeEnum valueOf(String name) => _$replaceTagCustomFieldItemDtoFieldTypeEnumValueOf(name);
}

