//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'set_admin_user_feature_flag_request_dto.g.dart';

/// SetAdminUserFeatureFlagRequestDto
///
/// Properties:
/// * [flag] 
/// * [enabled] 
@BuiltValue()
abstract class SetAdminUserFeatureFlagRequestDto implements Built<SetAdminUserFeatureFlagRequestDto, SetAdminUserFeatureFlagRequestDtoBuilder> {
  @BuiltValueField(wireName: r'flag')
  SetAdminUserFeatureFlagRequestDtoFlagEnum get flag;
  // enum flagEnum {  layoutReconstructionCompare,  sourceConnectors,  experimentalResearchModels,  exactAnswers,  smartDuplicates,  answerAbstention,  learnedValueTypes,  layoutKeyValueRoles,  localChatModel,  };

  @BuiltValueField(wireName: r'enabled')
  bool get enabled;

  SetAdminUserFeatureFlagRequestDto._();

  factory SetAdminUserFeatureFlagRequestDto([void updates(SetAdminUserFeatureFlagRequestDtoBuilder b)]) = _$SetAdminUserFeatureFlagRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SetAdminUserFeatureFlagRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SetAdminUserFeatureFlagRequestDto> get serializer => _$SetAdminUserFeatureFlagRequestDtoSerializer();
}

class _$SetAdminUserFeatureFlagRequestDtoSerializer implements PrimitiveSerializer<SetAdminUserFeatureFlagRequestDto> {
  @override
  final Iterable<Type> types = const [SetAdminUserFeatureFlagRequestDto, _$SetAdminUserFeatureFlagRequestDto];

  @override
  final String wireName = r'SetAdminUserFeatureFlagRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SetAdminUserFeatureFlagRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'flag';
    yield serializers.serialize(
      object.flag,
      specifiedType: const FullType(SetAdminUserFeatureFlagRequestDtoFlagEnum),
    );
    yield r'enabled';
    yield serializers.serialize(
      object.enabled,
      specifiedType: const FullType(bool),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SetAdminUserFeatureFlagRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SetAdminUserFeatureFlagRequestDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'flag':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SetAdminUserFeatureFlagRequestDtoFlagEnum),
          ) as SetAdminUserFeatureFlagRequestDtoFlagEnum;
          result.flag = valueDes;
          break;
        case r'enabled':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.enabled = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SetAdminUserFeatureFlagRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SetAdminUserFeatureFlagRequestDtoBuilder();
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

class SetAdminUserFeatureFlagRequestDtoFlagEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'layoutReconstructionCompare')
  static const SetAdminUserFeatureFlagRequestDtoFlagEnum layoutReconstructionCompare = _$setAdminUserFeatureFlagRequestDtoFlagEnum_layoutReconstructionCompare;
  @BuiltValueEnumConst(wireName: r'sourceConnectors')
  static const SetAdminUserFeatureFlagRequestDtoFlagEnum sourceConnectors = _$setAdminUserFeatureFlagRequestDtoFlagEnum_sourceConnectors;
  @BuiltValueEnumConst(wireName: r'experimentalResearchModels')
  static const SetAdminUserFeatureFlagRequestDtoFlagEnum experimentalResearchModels = _$setAdminUserFeatureFlagRequestDtoFlagEnum_experimentalResearchModels;
  @BuiltValueEnumConst(wireName: r'exactAnswers')
  static const SetAdminUserFeatureFlagRequestDtoFlagEnum exactAnswers = _$setAdminUserFeatureFlagRequestDtoFlagEnum_exactAnswers;
  @BuiltValueEnumConst(wireName: r'smartDuplicates')
  static const SetAdminUserFeatureFlagRequestDtoFlagEnum smartDuplicates = _$setAdminUserFeatureFlagRequestDtoFlagEnum_smartDuplicates;
  @BuiltValueEnumConst(wireName: r'answerAbstention')
  static const SetAdminUserFeatureFlagRequestDtoFlagEnum answerAbstention = _$setAdminUserFeatureFlagRequestDtoFlagEnum_answerAbstention;
  @BuiltValueEnumConst(wireName: r'learnedValueTypes')
  static const SetAdminUserFeatureFlagRequestDtoFlagEnum learnedValueTypes = _$setAdminUserFeatureFlagRequestDtoFlagEnum_learnedValueTypes;
  @BuiltValueEnumConst(wireName: r'layoutKeyValueRoles')
  static const SetAdminUserFeatureFlagRequestDtoFlagEnum layoutKeyValueRoles = _$setAdminUserFeatureFlagRequestDtoFlagEnum_layoutKeyValueRoles;
  @BuiltValueEnumConst(wireName: r'localChatModel')
  static const SetAdminUserFeatureFlagRequestDtoFlagEnum localChatModel = _$setAdminUserFeatureFlagRequestDtoFlagEnum_localChatModel;

  static Serializer<SetAdminUserFeatureFlagRequestDtoFlagEnum> get serializer => _$setAdminUserFeatureFlagRequestDtoFlagEnumSerializer;

  const SetAdminUserFeatureFlagRequestDtoFlagEnum._(String name): super(name);

  static BuiltSet<SetAdminUserFeatureFlagRequestDtoFlagEnum> get values => _$setAdminUserFeatureFlagRequestDtoFlagEnumValues;
  static SetAdminUserFeatureFlagRequestDtoFlagEnum valueOf(String name) => _$setAdminUserFeatureFlagRequestDtoFlagEnumValueOf(name);
}

