//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'document_pipeline_module_descriptor_dto.g.dart';

/// DocumentPipelineModuleDescriptorDto
///
/// Properties:
/// * [id] 
/// * [label] 
/// * [description] 
/// * [defaultEnabled] 
/// * [defaultOrder] 
@BuiltValue()
abstract class DocumentPipelineModuleDescriptorDto implements Built<DocumentPipelineModuleDescriptorDto, DocumentPipelineModuleDescriptorDtoBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'label')
  String get label;

  @BuiltValueField(wireName: r'description')
  String get description;

  @BuiltValueField(wireName: r'defaultEnabled')
  bool get defaultEnabled;

  @BuiltValueField(wireName: r'defaultOrder')
  num get defaultOrder;

  DocumentPipelineModuleDescriptorDto._();

  factory DocumentPipelineModuleDescriptorDto([void updates(DocumentPipelineModuleDescriptorDtoBuilder b)]) = _$DocumentPipelineModuleDescriptorDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DocumentPipelineModuleDescriptorDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DocumentPipelineModuleDescriptorDto> get serializer => _$DocumentPipelineModuleDescriptorDtoSerializer();
}

class _$DocumentPipelineModuleDescriptorDtoSerializer implements PrimitiveSerializer<DocumentPipelineModuleDescriptorDto> {
  @override
  final Iterable<Type> types = const [DocumentPipelineModuleDescriptorDto, _$DocumentPipelineModuleDescriptorDto];

  @override
  final String wireName = r'DocumentPipelineModuleDescriptorDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DocumentPipelineModuleDescriptorDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'label';
    yield serializers.serialize(
      object.label,
      specifiedType: const FullType(String),
    );
    yield r'description';
    yield serializers.serialize(
      object.description,
      specifiedType: const FullType(String),
    );
    yield r'defaultEnabled';
    yield serializers.serialize(
      object.defaultEnabled,
      specifiedType: const FullType(bool),
    );
    yield r'defaultOrder';
    yield serializers.serialize(
      object.defaultOrder,
      specifiedType: const FullType(num),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    DocumentPipelineModuleDescriptorDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DocumentPipelineModuleDescriptorDtoBuilder result,
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
        case r'label':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.label = valueDes;
          break;
        case r'description':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.description = valueDes;
          break;
        case r'defaultEnabled':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.defaultEnabled = valueDes;
          break;
        case r'defaultOrder':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.defaultOrder = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DocumentPipelineModuleDescriptorDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DocumentPipelineModuleDescriptorDtoBuilder();
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

