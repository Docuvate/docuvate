//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'workspace_ml_settings_response_dto.g.dart';

/// WorkspaceMlSettingsResponseDto
///
/// Properties:
/// * [labelAutoAssign] 
/// * [labelSuggestions] 
/// * [duplicateDetection] 
/// * [fieldAcceptance] 
/// * [editable] 
@BuiltValue()
abstract class WorkspaceMlSettingsResponseDto implements Built<WorkspaceMlSettingsResponseDto, WorkspaceMlSettingsResponseDtoBuilder> {
  @BuiltValueField(wireName: r'labelAutoAssign')
  WorkspaceMlSettingsResponseDtoLabelAutoAssignEnum get labelAutoAssign;
  // enum labelAutoAssignEnum {  off,  cautious,  normal,  };

  @BuiltValueField(wireName: r'labelSuggestions')
  WorkspaceMlSettingsResponseDtoLabelSuggestionsEnum get labelSuggestions;
  // enum labelSuggestionsEnum {  few,  normal,  many,  };

  @BuiltValueField(wireName: r'duplicateDetection')
  WorkspaceMlSettingsResponseDtoDuplicateDetectionEnum get duplicateDetection;
  // enum duplicateDetectionEnum {  off,  exact,  similar,  };

  @BuiltValueField(wireName: r'fieldAcceptance')
  WorkspaceMlSettingsResponseDtoFieldAcceptanceEnum get fieldAcceptance;
  // enum fieldAcceptanceEnum {  cautious,  normal,  generous,  };

  @BuiltValueField(wireName: r'editable')
  bool get editable;

  WorkspaceMlSettingsResponseDto._();

  factory WorkspaceMlSettingsResponseDto([void updates(WorkspaceMlSettingsResponseDtoBuilder b)]) = _$WorkspaceMlSettingsResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(WorkspaceMlSettingsResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<WorkspaceMlSettingsResponseDto> get serializer => _$WorkspaceMlSettingsResponseDtoSerializer();
}

class _$WorkspaceMlSettingsResponseDtoSerializer implements PrimitiveSerializer<WorkspaceMlSettingsResponseDto> {
  @override
  final Iterable<Type> types = const [WorkspaceMlSettingsResponseDto, _$WorkspaceMlSettingsResponseDto];

  @override
  final String wireName = r'WorkspaceMlSettingsResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    WorkspaceMlSettingsResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'labelAutoAssign';
    yield serializers.serialize(
      object.labelAutoAssign,
      specifiedType: const FullType(WorkspaceMlSettingsResponseDtoLabelAutoAssignEnum),
    );
    yield r'labelSuggestions';
    yield serializers.serialize(
      object.labelSuggestions,
      specifiedType: const FullType(WorkspaceMlSettingsResponseDtoLabelSuggestionsEnum),
    );
    yield r'duplicateDetection';
    yield serializers.serialize(
      object.duplicateDetection,
      specifiedType: const FullType(WorkspaceMlSettingsResponseDtoDuplicateDetectionEnum),
    );
    yield r'fieldAcceptance';
    yield serializers.serialize(
      object.fieldAcceptance,
      specifiedType: const FullType(WorkspaceMlSettingsResponseDtoFieldAcceptanceEnum),
    );
    yield r'editable';
    yield serializers.serialize(
      object.editable,
      specifiedType: const FullType(bool),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    WorkspaceMlSettingsResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required WorkspaceMlSettingsResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'labelAutoAssign':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(WorkspaceMlSettingsResponseDtoLabelAutoAssignEnum),
          ) as WorkspaceMlSettingsResponseDtoLabelAutoAssignEnum;
          result.labelAutoAssign = valueDes;
          break;
        case r'labelSuggestions':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(WorkspaceMlSettingsResponseDtoLabelSuggestionsEnum),
          ) as WorkspaceMlSettingsResponseDtoLabelSuggestionsEnum;
          result.labelSuggestions = valueDes;
          break;
        case r'duplicateDetection':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(WorkspaceMlSettingsResponseDtoDuplicateDetectionEnum),
          ) as WorkspaceMlSettingsResponseDtoDuplicateDetectionEnum;
          result.duplicateDetection = valueDes;
          break;
        case r'fieldAcceptance':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(WorkspaceMlSettingsResponseDtoFieldAcceptanceEnum),
          ) as WorkspaceMlSettingsResponseDtoFieldAcceptanceEnum;
          result.fieldAcceptance = valueDes;
          break;
        case r'editable':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.editable = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  WorkspaceMlSettingsResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = WorkspaceMlSettingsResponseDtoBuilder();
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

class WorkspaceMlSettingsResponseDtoLabelAutoAssignEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'off')
  static const WorkspaceMlSettingsResponseDtoLabelAutoAssignEnum off = _$workspaceMlSettingsResponseDtoLabelAutoAssignEnum_off;
  @BuiltValueEnumConst(wireName: r'cautious')
  static const WorkspaceMlSettingsResponseDtoLabelAutoAssignEnum cautious = _$workspaceMlSettingsResponseDtoLabelAutoAssignEnum_cautious;
  @BuiltValueEnumConst(wireName: r'normal')
  static const WorkspaceMlSettingsResponseDtoLabelAutoAssignEnum normal = _$workspaceMlSettingsResponseDtoLabelAutoAssignEnum_normal;

  static Serializer<WorkspaceMlSettingsResponseDtoLabelAutoAssignEnum> get serializer => _$workspaceMlSettingsResponseDtoLabelAutoAssignEnumSerializer;

  const WorkspaceMlSettingsResponseDtoLabelAutoAssignEnum._(String name): super(name);

  static BuiltSet<WorkspaceMlSettingsResponseDtoLabelAutoAssignEnum> get values => _$workspaceMlSettingsResponseDtoLabelAutoAssignEnumValues;
  static WorkspaceMlSettingsResponseDtoLabelAutoAssignEnum valueOf(String name) => _$workspaceMlSettingsResponseDtoLabelAutoAssignEnumValueOf(name);
}

class WorkspaceMlSettingsResponseDtoLabelSuggestionsEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'few')
  static const WorkspaceMlSettingsResponseDtoLabelSuggestionsEnum few = _$workspaceMlSettingsResponseDtoLabelSuggestionsEnum_few;
  @BuiltValueEnumConst(wireName: r'normal')
  static const WorkspaceMlSettingsResponseDtoLabelSuggestionsEnum normal = _$workspaceMlSettingsResponseDtoLabelSuggestionsEnum_normal;
  @BuiltValueEnumConst(wireName: r'many')
  static const WorkspaceMlSettingsResponseDtoLabelSuggestionsEnum many = _$workspaceMlSettingsResponseDtoLabelSuggestionsEnum_many;

  static Serializer<WorkspaceMlSettingsResponseDtoLabelSuggestionsEnum> get serializer => _$workspaceMlSettingsResponseDtoLabelSuggestionsEnumSerializer;

  const WorkspaceMlSettingsResponseDtoLabelSuggestionsEnum._(String name): super(name);

  static BuiltSet<WorkspaceMlSettingsResponseDtoLabelSuggestionsEnum> get values => _$workspaceMlSettingsResponseDtoLabelSuggestionsEnumValues;
  static WorkspaceMlSettingsResponseDtoLabelSuggestionsEnum valueOf(String name) => _$workspaceMlSettingsResponseDtoLabelSuggestionsEnumValueOf(name);
}

class WorkspaceMlSettingsResponseDtoDuplicateDetectionEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'off')
  static const WorkspaceMlSettingsResponseDtoDuplicateDetectionEnum off = _$workspaceMlSettingsResponseDtoDuplicateDetectionEnum_off;
  @BuiltValueEnumConst(wireName: r'exact')
  static const WorkspaceMlSettingsResponseDtoDuplicateDetectionEnum exact = _$workspaceMlSettingsResponseDtoDuplicateDetectionEnum_exact;
  @BuiltValueEnumConst(wireName: r'similar')
  static const WorkspaceMlSettingsResponseDtoDuplicateDetectionEnum similar = _$workspaceMlSettingsResponseDtoDuplicateDetectionEnum_similar;

  static Serializer<WorkspaceMlSettingsResponseDtoDuplicateDetectionEnum> get serializer => _$workspaceMlSettingsResponseDtoDuplicateDetectionEnumSerializer;

  const WorkspaceMlSettingsResponseDtoDuplicateDetectionEnum._(String name): super(name);

  static BuiltSet<WorkspaceMlSettingsResponseDtoDuplicateDetectionEnum> get values => _$workspaceMlSettingsResponseDtoDuplicateDetectionEnumValues;
  static WorkspaceMlSettingsResponseDtoDuplicateDetectionEnum valueOf(String name) => _$workspaceMlSettingsResponseDtoDuplicateDetectionEnumValueOf(name);
}

class WorkspaceMlSettingsResponseDtoFieldAcceptanceEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'cautious')
  static const WorkspaceMlSettingsResponseDtoFieldAcceptanceEnum cautious = _$workspaceMlSettingsResponseDtoFieldAcceptanceEnum_cautious;
  @BuiltValueEnumConst(wireName: r'normal')
  static const WorkspaceMlSettingsResponseDtoFieldAcceptanceEnum normal = _$workspaceMlSettingsResponseDtoFieldAcceptanceEnum_normal;
  @BuiltValueEnumConst(wireName: r'generous')
  static const WorkspaceMlSettingsResponseDtoFieldAcceptanceEnum generous = _$workspaceMlSettingsResponseDtoFieldAcceptanceEnum_generous;

  static Serializer<WorkspaceMlSettingsResponseDtoFieldAcceptanceEnum> get serializer => _$workspaceMlSettingsResponseDtoFieldAcceptanceEnumSerializer;

  const WorkspaceMlSettingsResponseDtoFieldAcceptanceEnum._(String name): super(name);

  static BuiltSet<WorkspaceMlSettingsResponseDtoFieldAcceptanceEnum> get values => _$workspaceMlSettingsResponseDtoFieldAcceptanceEnumValues;
  static WorkspaceMlSettingsResponseDtoFieldAcceptanceEnum valueOf(String name) => _$workspaceMlSettingsResponseDtoFieldAcceptanceEnumValueOf(name);
}

