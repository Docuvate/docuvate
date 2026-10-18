//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'feature_flags_response_dto.g.dart';

/// FeatureFlagsResponseDto
///
/// Properties:
/// * [layoutReconstructionCompare] 
/// * [sourceConnectors] 
/// * [experimentalResearchModels] 
/// * [exactAnswers] 
/// * [smartDuplicates] 
/// * [answerAbstention] 
/// * [learnedValueTypes] 
/// * [layoutKeyValueRoles] 
/// * [localChatModel] 
@BuiltValue()
abstract class FeatureFlagsResponseDto implements Built<FeatureFlagsResponseDto, FeatureFlagsResponseDtoBuilder> {
  @BuiltValueField(wireName: r'layoutReconstructionCompare')
  bool get layoutReconstructionCompare;

  @BuiltValueField(wireName: r'sourceConnectors')
  bool get sourceConnectors;

  @BuiltValueField(wireName: r'experimentalResearchModels')
  bool get experimentalResearchModels;

  @BuiltValueField(wireName: r'exactAnswers')
  bool get exactAnswers;

  @BuiltValueField(wireName: r'smartDuplicates')
  bool get smartDuplicates;

  @BuiltValueField(wireName: r'answerAbstention')
  bool get answerAbstention;

  @BuiltValueField(wireName: r'learnedValueTypes')
  bool get learnedValueTypes;

  @BuiltValueField(wireName: r'layoutKeyValueRoles')
  bool get layoutKeyValueRoles;

  @BuiltValueField(wireName: r'localChatModel')
  bool get localChatModel;

  FeatureFlagsResponseDto._();

  factory FeatureFlagsResponseDto([void updates(FeatureFlagsResponseDtoBuilder b)]) = _$FeatureFlagsResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(FeatureFlagsResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<FeatureFlagsResponseDto> get serializer => _$FeatureFlagsResponseDtoSerializer();
}

class _$FeatureFlagsResponseDtoSerializer implements PrimitiveSerializer<FeatureFlagsResponseDto> {
  @override
  final Iterable<Type> types = const [FeatureFlagsResponseDto, _$FeatureFlagsResponseDto];

  @override
  final String wireName = r'FeatureFlagsResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    FeatureFlagsResponseDto object, {
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
    yield r'exactAnswers';
    yield serializers.serialize(
      object.exactAnswers,
      specifiedType: const FullType(bool),
    );
    yield r'smartDuplicates';
    yield serializers.serialize(
      object.smartDuplicates,
      specifiedType: const FullType(bool),
    );
    yield r'answerAbstention';
    yield serializers.serialize(
      object.answerAbstention,
      specifiedType: const FullType(bool),
    );
    yield r'learnedValueTypes';
    yield serializers.serialize(
      object.learnedValueTypes,
      specifiedType: const FullType(bool),
    );
    yield r'layoutKeyValueRoles';
    yield serializers.serialize(
      object.layoutKeyValueRoles,
      specifiedType: const FullType(bool),
    );
    yield r'localChatModel';
    yield serializers.serialize(
      object.localChatModel,
      specifiedType: const FullType(bool),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    FeatureFlagsResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required FeatureFlagsResponseDtoBuilder result,
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
        case r'exactAnswers':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.exactAnswers = valueDes;
          break;
        case r'smartDuplicates':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.smartDuplicates = valueDes;
          break;
        case r'answerAbstention':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.answerAbstention = valueDes;
          break;
        case r'learnedValueTypes':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.learnedValueTypes = valueDes;
          break;
        case r'layoutKeyValueRoles':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.layoutKeyValueRoles = valueDes;
          break;
        case r'localChatModel':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.localChatModel = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  FeatureFlagsResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = FeatureFlagsResponseDtoBuilder();
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

