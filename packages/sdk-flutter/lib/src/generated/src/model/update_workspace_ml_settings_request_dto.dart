//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'update_workspace_ml_settings_request_dto.g.dart';

/// UpdateWorkspaceMlSettingsRequestDto
///
/// Properties:
/// * [labelAutoAssign] 
/// * [labelSuggestions] 
/// * [duplicateDetection] 
/// * [fieldAcceptance] 
@BuiltValue()
abstract class UpdateWorkspaceMlSettingsRequestDto implements Built<UpdateWorkspaceMlSettingsRequestDto, UpdateWorkspaceMlSettingsRequestDtoBuilder> {
  @BuiltValueField(wireName: r'labelAutoAssign')
  UpdateWorkspaceMlSettingsRequestDtoLabelAutoAssignEnum? get labelAutoAssign;
  // enum labelAutoAssignEnum {  off,  cautious,  normal,  };

  @BuiltValueField(wireName: r'labelSuggestions')
  UpdateWorkspaceMlSettingsRequestDtoLabelSuggestionsEnum? get labelSuggestions;
  // enum labelSuggestionsEnum {  few,  normal,  many,  };

  @BuiltValueField(wireName: r'duplicateDetection')
  UpdateWorkspaceMlSettingsRequestDtoDuplicateDetectionEnum? get duplicateDetection;
  // enum duplicateDetectionEnum {  off,  exact,  similar,  };

  @BuiltValueField(wireName: r'fieldAcceptance')
  UpdateWorkspaceMlSettingsRequestDtoFieldAcceptanceEnum? get fieldAcceptance;
  // enum fieldAcceptanceEnum {  cautious,  normal,  generous,  };

  UpdateWorkspaceMlSettingsRequestDto._();

  factory UpdateWorkspaceMlSettingsRequestDto([void updates(UpdateWorkspaceMlSettingsRequestDtoBuilder b)]) = _$UpdateWorkspaceMlSettingsRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UpdateWorkspaceMlSettingsRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UpdateWorkspaceMlSettingsRequestDto> get serializer => _$UpdateWorkspaceMlSettingsRequestDtoSerializer();
}

class _$UpdateWorkspaceMlSettingsRequestDtoSerializer implements PrimitiveSerializer<UpdateWorkspaceMlSettingsRequestDto> {
  @override
  final Iterable<Type> types = const [UpdateWorkspaceMlSettingsRequestDto, _$UpdateWorkspaceMlSettingsRequestDto];

  @override
  final String wireName = r'UpdateWorkspaceMlSettingsRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UpdateWorkspaceMlSettingsRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.labelAutoAssign != null) {
      yield r'labelAutoAssign';
      yield serializers.serialize(
        object.labelAutoAssign,
        specifiedType: const FullType(UpdateWorkspaceMlSettingsRequestDtoLabelAutoAssignEnum),
      );
    }
    if (object.labelSuggestions != null) {
      yield r'labelSuggestions';
      yield serializers.serialize(
        object.labelSuggestions,
        specifiedType: const FullType(UpdateWorkspaceMlSettingsRequestDtoLabelSuggestionsEnum),
      );
    }
    if (object.duplicateDetection != null) {
      yield r'duplicateDetection';
      yield serializers.serialize(
        object.duplicateDetection,
        specifiedType: const FullType(UpdateWorkspaceMlSettingsRequestDtoDuplicateDetectionEnum),
      );
    }
    if (object.fieldAcceptance != null) {
      yield r'fieldAcceptance';
      yield serializers.serialize(
        object.fieldAcceptance,
        specifiedType: const FullType(UpdateWorkspaceMlSettingsRequestDtoFieldAcceptanceEnum),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    UpdateWorkspaceMlSettingsRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required UpdateWorkspaceMlSettingsRequestDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'labelAutoAssign':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(UpdateWorkspaceMlSettingsRequestDtoLabelAutoAssignEnum),
          ) as UpdateWorkspaceMlSettingsRequestDtoLabelAutoAssignEnum;
          result.labelAutoAssign = valueDes;
          break;
        case r'labelSuggestions':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(UpdateWorkspaceMlSettingsRequestDtoLabelSuggestionsEnum),
          ) as UpdateWorkspaceMlSettingsRequestDtoLabelSuggestionsEnum;
          result.labelSuggestions = valueDes;
          break;
        case r'duplicateDetection':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(UpdateWorkspaceMlSettingsRequestDtoDuplicateDetectionEnum),
          ) as UpdateWorkspaceMlSettingsRequestDtoDuplicateDetectionEnum;
          result.duplicateDetection = valueDes;
          break;
        case r'fieldAcceptance':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(UpdateWorkspaceMlSettingsRequestDtoFieldAcceptanceEnum),
          ) as UpdateWorkspaceMlSettingsRequestDtoFieldAcceptanceEnum;
          result.fieldAcceptance = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  UpdateWorkspaceMlSettingsRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UpdateWorkspaceMlSettingsRequestDtoBuilder();
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

class UpdateWorkspaceMlSettingsRequestDtoLabelAutoAssignEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'off')
  static const UpdateWorkspaceMlSettingsRequestDtoLabelAutoAssignEnum off = _$updateWorkspaceMlSettingsRequestDtoLabelAutoAssignEnum_off;
  @BuiltValueEnumConst(wireName: r'cautious')
  static const UpdateWorkspaceMlSettingsRequestDtoLabelAutoAssignEnum cautious = _$updateWorkspaceMlSettingsRequestDtoLabelAutoAssignEnum_cautious;
  @BuiltValueEnumConst(wireName: r'normal')
  static const UpdateWorkspaceMlSettingsRequestDtoLabelAutoAssignEnum normal = _$updateWorkspaceMlSettingsRequestDtoLabelAutoAssignEnum_normal;

  static Serializer<UpdateWorkspaceMlSettingsRequestDtoLabelAutoAssignEnum> get serializer => _$updateWorkspaceMlSettingsRequestDtoLabelAutoAssignEnumSerializer;

  const UpdateWorkspaceMlSettingsRequestDtoLabelAutoAssignEnum._(String name): super(name);

  static BuiltSet<UpdateWorkspaceMlSettingsRequestDtoLabelAutoAssignEnum> get values => _$updateWorkspaceMlSettingsRequestDtoLabelAutoAssignEnumValues;
  static UpdateWorkspaceMlSettingsRequestDtoLabelAutoAssignEnum valueOf(String name) => _$updateWorkspaceMlSettingsRequestDtoLabelAutoAssignEnumValueOf(name);
}

class UpdateWorkspaceMlSettingsRequestDtoLabelSuggestionsEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'few')
  static const UpdateWorkspaceMlSettingsRequestDtoLabelSuggestionsEnum few = _$updateWorkspaceMlSettingsRequestDtoLabelSuggestionsEnum_few;
  @BuiltValueEnumConst(wireName: r'normal')
  static const UpdateWorkspaceMlSettingsRequestDtoLabelSuggestionsEnum normal = _$updateWorkspaceMlSettingsRequestDtoLabelSuggestionsEnum_normal;
  @BuiltValueEnumConst(wireName: r'many')
  static const UpdateWorkspaceMlSettingsRequestDtoLabelSuggestionsEnum many = _$updateWorkspaceMlSettingsRequestDtoLabelSuggestionsEnum_many;

  static Serializer<UpdateWorkspaceMlSettingsRequestDtoLabelSuggestionsEnum> get serializer => _$updateWorkspaceMlSettingsRequestDtoLabelSuggestionsEnumSerializer;

  const UpdateWorkspaceMlSettingsRequestDtoLabelSuggestionsEnum._(String name): super(name);

  static BuiltSet<UpdateWorkspaceMlSettingsRequestDtoLabelSuggestionsEnum> get values => _$updateWorkspaceMlSettingsRequestDtoLabelSuggestionsEnumValues;
  static UpdateWorkspaceMlSettingsRequestDtoLabelSuggestionsEnum valueOf(String name) => _$updateWorkspaceMlSettingsRequestDtoLabelSuggestionsEnumValueOf(name);
}

class UpdateWorkspaceMlSettingsRequestDtoDuplicateDetectionEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'off')
  static const UpdateWorkspaceMlSettingsRequestDtoDuplicateDetectionEnum off = _$updateWorkspaceMlSettingsRequestDtoDuplicateDetectionEnum_off;
  @BuiltValueEnumConst(wireName: r'exact')
  static const UpdateWorkspaceMlSettingsRequestDtoDuplicateDetectionEnum exact = _$updateWorkspaceMlSettingsRequestDtoDuplicateDetectionEnum_exact;
  @BuiltValueEnumConst(wireName: r'similar')
  static const UpdateWorkspaceMlSettingsRequestDtoDuplicateDetectionEnum similar = _$updateWorkspaceMlSettingsRequestDtoDuplicateDetectionEnum_similar;

  static Serializer<UpdateWorkspaceMlSettingsRequestDtoDuplicateDetectionEnum> get serializer => _$updateWorkspaceMlSettingsRequestDtoDuplicateDetectionEnumSerializer;

  const UpdateWorkspaceMlSettingsRequestDtoDuplicateDetectionEnum._(String name): super(name);

  static BuiltSet<UpdateWorkspaceMlSettingsRequestDtoDuplicateDetectionEnum> get values => _$updateWorkspaceMlSettingsRequestDtoDuplicateDetectionEnumValues;
  static UpdateWorkspaceMlSettingsRequestDtoDuplicateDetectionEnum valueOf(String name) => _$updateWorkspaceMlSettingsRequestDtoDuplicateDetectionEnumValueOf(name);
}

class UpdateWorkspaceMlSettingsRequestDtoFieldAcceptanceEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'cautious')
  static const UpdateWorkspaceMlSettingsRequestDtoFieldAcceptanceEnum cautious = _$updateWorkspaceMlSettingsRequestDtoFieldAcceptanceEnum_cautious;
  @BuiltValueEnumConst(wireName: r'normal')
  static const UpdateWorkspaceMlSettingsRequestDtoFieldAcceptanceEnum normal = _$updateWorkspaceMlSettingsRequestDtoFieldAcceptanceEnum_normal;
  @BuiltValueEnumConst(wireName: r'generous')
  static const UpdateWorkspaceMlSettingsRequestDtoFieldAcceptanceEnum generous = _$updateWorkspaceMlSettingsRequestDtoFieldAcceptanceEnum_generous;

  static Serializer<UpdateWorkspaceMlSettingsRequestDtoFieldAcceptanceEnum> get serializer => _$updateWorkspaceMlSettingsRequestDtoFieldAcceptanceEnumSerializer;

  const UpdateWorkspaceMlSettingsRequestDtoFieldAcceptanceEnum._(String name): super(name);

  static BuiltSet<UpdateWorkspaceMlSettingsRequestDtoFieldAcceptanceEnum> get values => _$updateWorkspaceMlSettingsRequestDtoFieldAcceptanceEnumValues;
  static UpdateWorkspaceMlSettingsRequestDtoFieldAcceptanceEnum valueOf(String name) => _$updateWorkspaceMlSettingsRequestDtoFieldAcceptanceEnumValueOf(name);
}

