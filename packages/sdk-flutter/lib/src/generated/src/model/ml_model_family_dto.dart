//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'ml_model_family_dto.g.dart';

/// MlModelFamilyDto
///
/// Properties:
/// * [id] 
/// * [kind] 
/// * [displayName] 
/// * [description] 
@BuiltValue()
abstract class MlModelFamilyDto implements Built<MlModelFamilyDto, MlModelFamilyDtoBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'kind')
  MlModelFamilyDtoKindEnum get kind;
  // enum kindEnum {  embedding,  ocr,  docqa,  field_extractor,  };

  @BuiltValueField(wireName: r'displayName')
  String get displayName;

  @BuiltValueField(wireName: r'description')
  String get description;

  MlModelFamilyDto._();

  factory MlModelFamilyDto([void updates(MlModelFamilyDtoBuilder b)]) = _$MlModelFamilyDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(MlModelFamilyDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<MlModelFamilyDto> get serializer => _$MlModelFamilyDtoSerializer();
}

class _$MlModelFamilyDtoSerializer implements PrimitiveSerializer<MlModelFamilyDto> {
  @override
  final Iterable<Type> types = const [MlModelFamilyDto, _$MlModelFamilyDto];

  @override
  final String wireName = r'MlModelFamilyDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    MlModelFamilyDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'kind';
    yield serializers.serialize(
      object.kind,
      specifiedType: const FullType(MlModelFamilyDtoKindEnum),
    );
    yield r'displayName';
    yield serializers.serialize(
      object.displayName,
      specifiedType: const FullType(String),
    );
    yield r'description';
    yield serializers.serialize(
      object.description,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    MlModelFamilyDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required MlModelFamilyDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'kind':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(MlModelFamilyDtoKindEnum),
          ) as MlModelFamilyDtoKindEnum;
          result.kind = valueDes;
          break;
        case r'displayName':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.displayName = valueDes;
          break;
        case r'description':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.description = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  MlModelFamilyDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = MlModelFamilyDtoBuilder();
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

class MlModelFamilyDtoKindEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'embedding')
  static const MlModelFamilyDtoKindEnum embedding = _$mlModelFamilyDtoKindEnum_embedding;
  @BuiltValueEnumConst(wireName: r'ocr')
  static const MlModelFamilyDtoKindEnum ocr = _$mlModelFamilyDtoKindEnum_ocr;
  @BuiltValueEnumConst(wireName: r'docqa')
  static const MlModelFamilyDtoKindEnum docqa = _$mlModelFamilyDtoKindEnum_docqa;
  @BuiltValueEnumConst(wireName: r'field_extractor')
  static const MlModelFamilyDtoKindEnum fieldExtractor = _$mlModelFamilyDtoKindEnum_fieldExtractor;

  static Serializer<MlModelFamilyDtoKindEnum> get serializer => _$mlModelFamilyDtoKindEnumSerializer;

  const MlModelFamilyDtoKindEnum._(String name): super(name);

  static BuiltSet<MlModelFamilyDtoKindEnum> get values => _$mlModelFamilyDtoKindEnumValues;
  static MlModelFamilyDtoKindEnum valueOf(String name) => _$mlModelFamilyDtoKindEnumValueOf(name);
}

