//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'replace_recognized_field_item_dto.g.dart';

/// ReplaceRecognizedFieldItemDto
///
/// Properties:
/// * [key] 
/// * [label] 
/// * [fieldType] 
/// * [sortOrder] 
/// * [extractForAllDocuments] 
/// * [gateLabelIds] 
/// * [gateLabelMatch] 
/// * [minLabelConfidence] 
/// * [confidenceGateEnabled] 
@BuiltValue()
abstract class ReplaceRecognizedFieldItemDto implements Built<ReplaceRecognizedFieldItemDto, ReplaceRecognizedFieldItemDtoBuilder> {
  @BuiltValueField(wireName: r'key')
  String get key;

  @BuiltValueField(wireName: r'label')
  String get label;

  @BuiltValueField(wireName: r'fieldType')
  ReplaceRecognizedFieldItemDtoFieldTypeEnum? get fieldType;
  // enum fieldTypeEnum {  text,  date,  number,  currency,  };

  @BuiltValueField(wireName: r'sortOrder')
  num? get sortOrder;

  @BuiltValueField(wireName: r'extractForAllDocuments')
  bool? get extractForAllDocuments;

  @BuiltValueField(wireName: r'gateLabelIds')
  BuiltList<String>? get gateLabelIds;

  @BuiltValueField(wireName: r'gateLabelMatch')
  ReplaceRecognizedFieldItemDtoGateLabelMatchEnum? get gateLabelMatch;
  // enum gateLabelMatchEnum {  any,  all,  };

  @BuiltValueField(wireName: r'minLabelConfidence')
  num? get minLabelConfidence;

  @BuiltValueField(wireName: r'confidenceGateEnabled')
  bool? get confidenceGateEnabled;

  ReplaceRecognizedFieldItemDto._();

  factory ReplaceRecognizedFieldItemDto([void updates(ReplaceRecognizedFieldItemDtoBuilder b)]) = _$ReplaceRecognizedFieldItemDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ReplaceRecognizedFieldItemDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ReplaceRecognizedFieldItemDto> get serializer => _$ReplaceRecognizedFieldItemDtoSerializer();
}

class _$ReplaceRecognizedFieldItemDtoSerializer implements PrimitiveSerializer<ReplaceRecognizedFieldItemDto> {
  @override
  final Iterable<Type> types = const [ReplaceRecognizedFieldItemDto, _$ReplaceRecognizedFieldItemDto];

  @override
  final String wireName = r'ReplaceRecognizedFieldItemDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ReplaceRecognizedFieldItemDto object, {
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
        specifiedType: const FullType(ReplaceRecognizedFieldItemDtoFieldTypeEnum),
      );
    }
    if (object.sortOrder != null) {
      yield r'sortOrder';
      yield serializers.serialize(
        object.sortOrder,
        specifiedType: const FullType(num),
      );
    }
    if (object.extractForAllDocuments != null) {
      yield r'extractForAllDocuments';
      yield serializers.serialize(
        object.extractForAllDocuments,
        specifiedType: const FullType(bool),
      );
    }
    if (object.gateLabelIds != null) {
      yield r'gateLabelIds';
      yield serializers.serialize(
        object.gateLabelIds,
        specifiedType: const FullType(BuiltList, [FullType(String)]),
      );
    }
    if (object.gateLabelMatch != null) {
      yield r'gateLabelMatch';
      yield serializers.serialize(
        object.gateLabelMatch,
        specifiedType: const FullType(ReplaceRecognizedFieldItemDtoGateLabelMatchEnum),
      );
    }
    if (object.minLabelConfidence != null) {
      yield r'minLabelConfidence';
      yield serializers.serialize(
        object.minLabelConfidence,
        specifiedType: const FullType(num),
      );
    }
    if (object.confidenceGateEnabled != null) {
      yield r'confidenceGateEnabled';
      yield serializers.serialize(
        object.confidenceGateEnabled,
        specifiedType: const FullType(bool),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    ReplaceRecognizedFieldItemDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ReplaceRecognizedFieldItemDtoBuilder result,
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
            specifiedType: const FullType(ReplaceRecognizedFieldItemDtoFieldTypeEnum),
          ) as ReplaceRecognizedFieldItemDtoFieldTypeEnum;
          result.fieldType = valueDes;
          break;
        case r'sortOrder':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.sortOrder = valueDes;
          break;
        case r'extractForAllDocuments':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.extractForAllDocuments = valueDes;
          break;
        case r'gateLabelIds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.gateLabelIds.replace(valueDes);
          break;
        case r'gateLabelMatch':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ReplaceRecognizedFieldItemDtoGateLabelMatchEnum),
          ) as ReplaceRecognizedFieldItemDtoGateLabelMatchEnum;
          result.gateLabelMatch = valueDes;
          break;
        case r'minLabelConfidence':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.minLabelConfidence = valueDes;
          break;
        case r'confidenceGateEnabled':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.confidenceGateEnabled = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ReplaceRecognizedFieldItemDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ReplaceRecognizedFieldItemDtoBuilder();
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

class ReplaceRecognizedFieldItemDtoFieldTypeEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'text')
  static const ReplaceRecognizedFieldItemDtoFieldTypeEnum text = _$replaceRecognizedFieldItemDtoFieldTypeEnum_text;
  @BuiltValueEnumConst(wireName: r'date')
  static const ReplaceRecognizedFieldItemDtoFieldTypeEnum date = _$replaceRecognizedFieldItemDtoFieldTypeEnum_date;
  @BuiltValueEnumConst(wireName: r'number')
  static const ReplaceRecognizedFieldItemDtoFieldTypeEnum number = _$replaceRecognizedFieldItemDtoFieldTypeEnum_number;
  @BuiltValueEnumConst(wireName: r'currency')
  static const ReplaceRecognizedFieldItemDtoFieldTypeEnum currency = _$replaceRecognizedFieldItemDtoFieldTypeEnum_currency;

  static Serializer<ReplaceRecognizedFieldItemDtoFieldTypeEnum> get serializer => _$replaceRecognizedFieldItemDtoFieldTypeEnumSerializer;

  const ReplaceRecognizedFieldItemDtoFieldTypeEnum._(String name): super(name);

  static BuiltSet<ReplaceRecognizedFieldItemDtoFieldTypeEnum> get values => _$replaceRecognizedFieldItemDtoFieldTypeEnumValues;
  static ReplaceRecognizedFieldItemDtoFieldTypeEnum valueOf(String name) => _$replaceRecognizedFieldItemDtoFieldTypeEnumValueOf(name);
}

class ReplaceRecognizedFieldItemDtoGateLabelMatchEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'any')
  static const ReplaceRecognizedFieldItemDtoGateLabelMatchEnum any = _$replaceRecognizedFieldItemDtoGateLabelMatchEnum_any;
  @BuiltValueEnumConst(wireName: r'all')
  static const ReplaceRecognizedFieldItemDtoGateLabelMatchEnum all = _$replaceRecognizedFieldItemDtoGateLabelMatchEnum_all;

  static Serializer<ReplaceRecognizedFieldItemDtoGateLabelMatchEnum> get serializer => _$replaceRecognizedFieldItemDtoGateLabelMatchEnumSerializer;

  const ReplaceRecognizedFieldItemDtoGateLabelMatchEnum._(String name): super(name);

  static BuiltSet<ReplaceRecognizedFieldItemDtoGateLabelMatchEnum> get values => _$replaceRecognizedFieldItemDtoGateLabelMatchEnumValues;
  static ReplaceRecognizedFieldItemDtoGateLabelMatchEnum valueOf(String name) => _$replaceRecognizedFieldItemDtoGateLabelMatchEnumValueOf(name);
}

