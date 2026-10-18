//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'preview_connector_source_nodes_request_dto.g.dart';

/// PreviewConnectorSourceNodesRequestDto
///
/// Properties:
/// * [credentials] 
/// * [parentPath] 
@BuiltValue()
abstract class PreviewConnectorSourceNodesRequestDto implements Built<PreviewConnectorSourceNodesRequestDto, PreviewConnectorSourceNodesRequestDtoBuilder> {
  @BuiltValueField(wireName: r'credentials')
  BuiltMap<String, String> get credentials;

  @BuiltValueField(wireName: r'parentPath')
  String? get parentPath;

  PreviewConnectorSourceNodesRequestDto._();

  factory PreviewConnectorSourceNodesRequestDto([void updates(PreviewConnectorSourceNodesRequestDtoBuilder b)]) = _$PreviewConnectorSourceNodesRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(PreviewConnectorSourceNodesRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<PreviewConnectorSourceNodesRequestDto> get serializer => _$PreviewConnectorSourceNodesRequestDtoSerializer();
}

class _$PreviewConnectorSourceNodesRequestDtoSerializer implements PrimitiveSerializer<PreviewConnectorSourceNodesRequestDto> {
  @override
  final Iterable<Type> types = const [PreviewConnectorSourceNodesRequestDto, _$PreviewConnectorSourceNodesRequestDto];

  @override
  final String wireName = r'PreviewConnectorSourceNodesRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    PreviewConnectorSourceNodesRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'credentials';
    yield serializers.serialize(
      object.credentials,
      specifiedType: const FullType(BuiltMap, [FullType(String), FullType(String)]),
    );
    if (object.parentPath != null) {
      yield r'parentPath';
      yield serializers.serialize(
        object.parentPath,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    PreviewConnectorSourceNodesRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required PreviewConnectorSourceNodesRequestDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'credentials':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltMap, [FullType(String), FullType(String)]),
          ) as BuiltMap<String, String>;
          result.credentials.replace(valueDes);
          break;
        case r'parentPath':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.parentPath = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  PreviewConnectorSourceNodesRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = PreviewConnectorSourceNodesRequestDtoBuilder();
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

