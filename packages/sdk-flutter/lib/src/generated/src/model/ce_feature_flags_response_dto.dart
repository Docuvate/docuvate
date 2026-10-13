//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'ce_feature_flags_response_dto.g.dart';

/// CeFeatureFlagsResponseDto
///
/// Properties:
/// * [layoutReconstructionCompare] 
/// * [sourceConnectors] 
/// * [experimentalResearchModels] 
@BuiltValue()
abstract class CeFeatureFlagsResponseDto implements Built<CeFeatureFlagsResponseDto, CeFeatureFlagsResponseDtoBuilder> {
  @BuiltValueField(wireName: r'layoutReconstructionCompare')
  bool get layoutReconstructionCompare;

  @BuiltValueField(wireName: r'sourceConnectors')
  bool get sourceConnectors;

  @BuiltValueField(wireName: r'experimentalResearchModels')
  bool get experimentalResearchModels;

  CeFeatureFlagsResponseDto._();

  factory CeFeatureFlagsResponseDto([void updates(CeFeatureFlagsResponseDtoBuilder b)]) = _$CeFeatureFlagsResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CeFeatureFlagsResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CeFeatureFlagsResponseDto> get serializer => _$CeFeatureFlagsResponseDtoSerializer();
}

class _$CeFeatureFlagsResponseDtoSerializer implements PrimitiveSerializer<CeFeatureFlagsResponseDto> {
  @override
  final Iterable<Type> types = const [CeFeatureFlagsResponseDto, _$CeFeatureFlagsResponseDto];

  @override
  final String wireName = r'CeFeatureFlagsResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CeFeatureFlagsResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'layoutReconstructionCompare';
    yield serializers.serialize(
      object.layoutReconstructionCompare,
      specifiedType: const FullType(bool),
    );
    yield r'sourceConnectors';
    yield serializers.serialize(
      object.sourceConnectors,
      specifiedType: const FullType(bool),
    );
    yield r'experimentalResearchModels';
    yield serializers.serialize(
      object.experimentalResearchModels,
      specifiedType: const FullType(bool),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    CeFeatureFlagsResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required CeFeatureFlagsResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'layoutReconstructionCompare':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.layoutReconstructionCompare = valueDes;
          break;
        case r'sourceConnectors':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.sourceConnectors = valueDes;
          break;
        case r'experimentalResearchModels':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.experimentalResearchModels = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CeFeatureFlagsResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CeFeatureFlagsResponseDtoBuilder();
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

