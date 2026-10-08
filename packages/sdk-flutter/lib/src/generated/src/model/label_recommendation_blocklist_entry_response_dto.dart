//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'label_recommendation_blocklist_entry_response_dto.g.dart';

/// LabelRecommendationBlocklistEntryResponseDto
///
/// Properties:
/// * [id] 
/// * [phrase] 
/// * [source_] 
/// * [createdAt] 
@BuiltValue()
abstract class LabelRecommendationBlocklistEntryResponseDto implements Built<LabelRecommendationBlocklistEntryResponseDto, LabelRecommendationBlocklistEntryResponseDtoBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'phrase')
  String get phrase;

  @BuiltValueField(wireName: r'source')
  LabelRecommendationBlocklistEntryResponseDtoSource_Enum get source_;
  // enum source_Enum {  manual,  dismiss,  };

  @BuiltValueField(wireName: r'createdAt')
  String get createdAt;

  LabelRecommendationBlocklistEntryResponseDto._();

  factory LabelRecommendationBlocklistEntryResponseDto([void updates(LabelRecommendationBlocklistEntryResponseDtoBuilder b)]) = _$LabelRecommendationBlocklistEntryResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(LabelRecommendationBlocklistEntryResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<LabelRecommendationBlocklistEntryResponseDto> get serializer => _$LabelRecommendationBlocklistEntryResponseDtoSerializer();
}

class _$LabelRecommendationBlocklistEntryResponseDtoSerializer implements PrimitiveSerializer<LabelRecommendationBlocklistEntryResponseDto> {
  @override
  final Iterable<Type> types = const [LabelRecommendationBlocklistEntryResponseDto, _$LabelRecommendationBlocklistEntryResponseDto];

  @override
  final String wireName = r'LabelRecommendationBlocklistEntryResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    LabelRecommendationBlocklistEntryResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'phrase';
    yield serializers.serialize(
      object.phrase,
      specifiedType: const FullType(String),
    );
    yield r'source';
    yield serializers.serialize(
      object.source_,
      specifiedType: const FullType(LabelRecommendationBlocklistEntryResponseDtoSource_Enum),
    );
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    LabelRecommendationBlocklistEntryResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required LabelRecommendationBlocklistEntryResponseDtoBuilder result,
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
        case r'phrase':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.phrase = valueDes;
          break;
        case r'source':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(LabelRecommendationBlocklistEntryResponseDtoSource_Enum),
          ) as LabelRecommendationBlocklistEntryResponseDtoSource_Enum;
          result.source_ = valueDes;
          break;
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.createdAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  LabelRecommendationBlocklistEntryResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = LabelRecommendationBlocklistEntryResponseDtoBuilder();
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

class LabelRecommendationBlocklistEntryResponseDtoSource_Enum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'manual')
  static const LabelRecommendationBlocklistEntryResponseDtoSource_Enum manual = _$labelRecommendationBlocklistEntryResponseDtoSourceEnum_manual;
  @BuiltValueEnumConst(wireName: r'dismiss')
  static const LabelRecommendationBlocklistEntryResponseDtoSource_Enum dismiss = _$labelRecommendationBlocklistEntryResponseDtoSourceEnum_dismiss;

  static Serializer<LabelRecommendationBlocklistEntryResponseDtoSource_Enum> get serializer => _$labelRecommendationBlocklistEntryResponseDtoSourceEnumSerializer;

  const LabelRecommendationBlocklistEntryResponseDtoSource_Enum._(String name): super(name);

  static BuiltSet<LabelRecommendationBlocklistEntryResponseDtoSource_Enum> get values => _$labelRecommendationBlocklistEntryResponseDtoSourceEnumValues;
  static LabelRecommendationBlocklistEntryResponseDtoSource_Enum valueOf(String name) => _$labelRecommendationBlocklistEntryResponseDtoSourceEnumValueOf(name);
}

