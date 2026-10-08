//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:docuvate/src/generated/src/model/document_pipeline_module_descriptor_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'document_pipeline_modules_response_dto.g.dart';

/// DocumentPipelineModulesResponseDto
///
/// Properties:
/// * [modules] 
@BuiltValue()
abstract class DocumentPipelineModulesResponseDto implements Built<DocumentPipelineModulesResponseDto, DocumentPipelineModulesResponseDtoBuilder> {
  @BuiltValueField(wireName: r'modules')
  BuiltList<DocumentPipelineModuleDescriptorDto> get modules;

  DocumentPipelineModulesResponseDto._();

  factory DocumentPipelineModulesResponseDto([void updates(DocumentPipelineModulesResponseDtoBuilder b)]) = _$DocumentPipelineModulesResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DocumentPipelineModulesResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DocumentPipelineModulesResponseDto> get serializer => _$DocumentPipelineModulesResponseDtoSerializer();
}

class _$DocumentPipelineModulesResponseDtoSerializer implements PrimitiveSerializer<DocumentPipelineModulesResponseDto> {
  @override
  final Iterable<Type> types = const [DocumentPipelineModulesResponseDto, _$DocumentPipelineModulesResponseDto];

  @override
  final String wireName = r'DocumentPipelineModulesResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DocumentPipelineModulesResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'modules';
    yield serializers.serialize(
      object.modules,
      specifiedType: const FullType(BuiltList, [FullType(DocumentPipelineModuleDescriptorDto)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    DocumentPipelineModulesResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DocumentPipelineModulesResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'modules':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(DocumentPipelineModuleDescriptorDto)]),
          ) as BuiltList<DocumentPipelineModuleDescriptorDto>;
          result.modules.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DocumentPipelineModulesResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DocumentPipelineModulesResponseDtoBuilder();
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

